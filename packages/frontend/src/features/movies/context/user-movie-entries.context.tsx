import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { StringUtils } from "@/utils/string.utils";
import { UserMovieEntryPatchDTO } from "../dto/user-movie-entry.dto";
import { UserMovieEntryEntity } from "../entities/user-movie-entry.entity";
import { UserMovieEntryService } from "../services/user-movie-entry.service";
import {
  UserMovieEntriesContext,
  WatchedUndoSnapshot,
} from "./user-movie-entries-context";
import {
  DEFAULT_USER_MOVIE_ENTRY_FLAGS,
  UserMovieEntryFlags,
  UserMovieEntryMergeUtils,
} from "./user-movie-entry-merge.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

const UNDO_WINDOW_MS = 7000;

export function UserMovieEntriesProvider({ children }: PropsWithChildren) {
  const { accessToken } = useAuth();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  const [entries, setEntries] = useState<Map<number, UserMovieEntryEntity>>(
    () => new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [patchingTmdbIds, setPatchingTmdbIds] = useState<Set<number>>(
    () => new Set(),
  );

  const patchSequenceByTmdbIdRef = useRef<Map<number, number>>(new Map());
  const lastKnownGoodByTmdbIdRef = useRef<
    Map<number, UserMovieEntryEntity | undefined>
  >(new Map());
  const [watchedUndoByTmdbId, setWatchedUndoByTmdbId] = useState<
    Map<number, WatchedUndoSnapshot>
  >(() => new Map());
  const undoTimerByTmdbIdRef = useRef<
    Map<number, ReturnType<typeof setTimeout>>
  >(new Map());

  useEffect(() => {
    const undoTimers = undoTimerByTmdbIdRef.current;
    return () => {
      for (const timer of undoTimers.values()) {
        clearTimeout(timer);
      }
      undoTimers.clear();
    };
  }, []);

  useEffect(() => {
    if (!hasAccessToken) {
      setEntries(new Map());
      lastKnownGoodByTmdbIdRef.current.clear();
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    setIsLoading(true);
    console.info(
      "[UserMovieEntries] 🚀 Iniciando hidratação das entradas do usuário",
    );

    UserMovieEntryService.listEntries()
      .then((list) => {
        if (isCancelled) {
          return;
        }

        const entriesMap = new Map<number, UserMovieEntryEntity>();
        const lastKnownGoodMap = new Map<number, UserMovieEntryEntity>();
        for (const entry of list) {
          entriesMap.set(entry.tmdbId, entry);
          lastKnownGoodMap.set(entry.tmdbId, entry);
        }

        lastKnownGoodByTmdbIdRef.current = lastKnownGoodMap;
        setEntries(entriesMap);
        console.info("[UserMovieEntries] ✅ Hidratação concluída", {
          entryCount: list.length,
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "[UserMovieEntries] ❌ Falha na hidratação das entradas",
          { error },
        );
        toast.error(GENERIC_ERROR_TOAST);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [hasAccessToken, accessToken]);

  const addPatchingTmdbId = useCallback((tmdbId: number) => {
    setPatchingTmdbIds((current) => {
      const next = new Set(current);
      next.add(tmdbId);
      return next;
    });
  }, []);

  const removePatchingTmdbId = useCallback((tmdbId: number) => {
    setPatchingTmdbIds((current) => {
      const next = new Set(current);
      next.delete(tmdbId);
      return next;
    });
  }, []);

  const getFlags = useCallback(
    (tmdbId: number): UserMovieEntryFlags => {
      const entry = entries.get(tmdbId);
      if (!entry) {
        return { ...DEFAULT_USER_MOVIE_ENTRY_FLAGS };
      }

      return UserMovieEntryMergeUtils.toFlags(entry);
    },
    [entries],
  );

  const hasEntry = useCallback(
    (tmdbId: number): boolean => {
      return entries.has(tmdbId);
    },
    [entries],
  );

  const patchEntry = useCallback(
    async (
      tmdbId: number,
      patch: UserMovieEntryPatchDTO,
    ): Promise<boolean> => {
      const currentSequence = patchSequenceByTmdbIdRef.current.get(tmdbId) ?? 0;
      const requestSequence = currentSequence + 1;
      patchSequenceByTmdbIdRef.current.set(tmdbId, requestSequence);

      setEntries((current) => {
        const currentEntry = current.get(tmdbId);
        const optimisticEntry = UserMovieEntryMergeUtils.applyOptimisticPatch(
          currentEntry,
          tmdbId,
          patch,
        );
        const next = new Map(current);
        next.set(tmdbId, optimisticEntry);
        return next;
      });

      addPatchingTmdbId(tmdbId);

      try {
        const serverEntry = await UserMovieEntryService.patchEntry(
          tmdbId,
          patch,
        );

        const latestSequence =
          patchSequenceByTmdbIdRef.current.get(tmdbId) ?? 0;
        const isStaleResponse = latestSequence !== requestSequence;
        if (isStaleResponse) {
          return true;
        }

        if (serverEntry === null) {
          lastKnownGoodByTmdbIdRef.current.delete(tmdbId);
        } else {
          lastKnownGoodByTmdbIdRef.current.set(tmdbId, serverEntry);
        }

        setEntries((current) => {
          const next = new Map(current);
          if (serverEntry === null) {
            next.delete(tmdbId);
          } else {
            next.set(tmdbId, serverEntry);
          }
          return next;
        });

        return true;
      } catch (error) {
        const latestSequence =
          patchSequenceByTmdbIdRef.current.get(tmdbId) ?? 0;
        const isStaleResponse = latestSequence !== requestSequence;
        if (isStaleResponse) {
          return true;
        }

        const lastKnownGood = lastKnownGoodByTmdbIdRef.current.get(tmdbId);

        console.error(
          "[UserMovieEntries] ⚠️ Revertendo PATCH otimista após falha",
          { tmdbId, error },
        );

        setEntries((current) => {
          const next = new Map(current);
          if (lastKnownGood === undefined) {
            next.delete(tmdbId);
          } else {
            next.set(tmdbId, lastKnownGood);
          }
          return next;
        });

        toast.error(GENERIC_ERROR_TOAST);
        return false;
      } finally {
        const latestSequence =
          patchSequenceByTmdbIdRef.current.get(tmdbId) ?? 0;
        const isLatestRequest = latestSequence === requestSequence;
        if (isLatestRequest) {
          removePatchingTmdbId(tmdbId);
        }
      }
    },
    [addPatchingTmdbId, removePatchingTmdbId],
  );

  const isPatching = useCallback(
    (tmdbId: number): boolean => {
      return patchingTmdbIds.has(tmdbId);
    },
    [patchingTmdbIds],
  );

  const clearWatchedUndoTimer = useCallback((tmdbId: number) => {
    const undoTimers = undoTimerByTmdbIdRef.current;
    const timer = undoTimers.get(tmdbId);
    if (timer === undefined) {
      return;
    }

    clearTimeout(timer);
    undoTimers.delete(tmdbId);
  }, []);

  const removeWatchedUndo = useCallback((tmdbId: number) => {
    setWatchedUndoByTmdbId((current) => {
      if (!current.has(tmdbId)) {
        return current;
      }

      const next = new Map(current);
      next.delete(tmdbId);
      return next;
    });
  }, []);

  const cancelWatchedUndo = useCallback(
    (tmdbId: number) => {
      clearWatchedUndoTimer(tmdbId);
      removeWatchedUndo(tmdbId);
    },
    [clearWatchedUndoTimer, removeWatchedUndo],
  );

  const startWatchedUndo = useCallback(
    (tmdbId: number, snapshot: WatchedUndoSnapshot) => {
      clearWatchedUndoTimer(tmdbId);
      setWatchedUndoByTmdbId((current) => {
        const next = new Map(current);
        next.set(tmdbId, snapshot);
        return next;
      });

      const timer = setTimeout(() => {
        undoTimerByTmdbIdRef.current.delete(tmdbId);
        removeWatchedUndo(tmdbId);
      }, UNDO_WINDOW_MS);
      undoTimerByTmdbIdRef.current.set(tmdbId, timer);
    },
    [clearWatchedUndoTimer, removeWatchedUndo],
  );

  const getWatchedUndo = useCallback(
    (tmdbId: number): WatchedUndoSnapshot | null => {
      return watchedUndoByTmdbId.get(tmdbId) ?? null;
    },
    [watchedUndoByTmdbId],
  );

  const undoWatchedDelete = useCallback(
    async (tmdbId: number): Promise<void> => {
      const snapshot = watchedUndoByTmdbId.get(tmdbId);
      if (snapshot === undefined) {
        return;
      }

      cancelWatchedUndo(tmdbId);
      await patchEntry(tmdbId, {
        watched: true,
        rating: snapshot.rating,
        watchedAt: snapshot.watchedAt,
      });
    },
    [watchedUndoByTmdbId, cancelWatchedUndo, patchEntry],
  );

  const value = useMemo(
    () => ({
      getFlags,
      hasEntry,
      patchEntry,
      isLoading,
      isPatching,
      getWatchedUndo,
      startWatchedUndo,
      cancelWatchedUndo,
      undoWatchedDelete,
    }),
    [
      getFlags,
      hasEntry,
      patchEntry,
      isLoading,
      isPatching,
      getWatchedUndo,
      startWatchedUndo,
      cancelWatchedUndo,
      undoWatchedDelete,
    ],
  );

  return (
    <UserMovieEntriesContext.Provider value={value}>
      {children}
    </UserMovieEntriesContext.Provider>
  );
}
