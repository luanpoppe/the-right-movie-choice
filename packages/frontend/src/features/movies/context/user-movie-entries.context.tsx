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
import { UserMovieEntriesContext } from "./user-movie-entries-context";
import {
  DEFAULT_USER_MOVIE_ENTRY_FLAGS,
  UserMovieEntryFlags,
  UserMovieEntryMergeUtils,
} from "./user-movie-entry-merge.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

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

  useEffect(() => {
    if (!hasAccessToken) {
      setEntries(new Map());
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
        for (const entry of list) {
          entriesMap.set(entry.tmdbId, entry);
        }

        setEntries(entriesMap);
        console.info("[UserMovieEntries] ✅ Hidratação concluída", {
          entryCount: list.length,
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.info(
          "[UserMovieEntries] ❌ Falha na hidratação das entradas",
          { error },
        );
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

  const patchEntry = useCallback(
    async (tmdbId: number, patch: UserMovieEntryPatchDTO): Promise<void> => {
      const currentSequence = patchSequenceByTmdbIdRef.current.get(tmdbId) ?? 0;
      const requestSequence = currentSequence + 1;
      patchSequenceByTmdbIdRef.current.set(tmdbId, requestSequence);

      let snapshotEntry: UserMovieEntryEntity | undefined;

      setEntries((current) => {
        snapshotEntry = current.get(tmdbId);
        const optimisticEntry = UserMovieEntryMergeUtils.applyOptimisticPatch(
          snapshotEntry,
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
          return;
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
      } catch (error) {
        const latestSequence =
          patchSequenceByTmdbIdRef.current.get(tmdbId) ?? 0;
        const isStaleResponse = latestSequence !== requestSequence;
        if (isStaleResponse) {
          return;
        }

        console.info(
          "[UserMovieEntries] ⚠️ Revertendo PATCH otimista após falha",
          { tmdbId, error },
        );

        setEntries((current) => {
          const next = new Map(current);
          if (snapshotEntry === undefined) {
            next.delete(tmdbId);
          } else {
            next.set(tmdbId, snapshotEntry);
          }
          return next;
        });

        toast.error(GENERIC_ERROR_TOAST);
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

  const value = useMemo(
    () => ({
      getFlags,
      patchEntry,
      isLoading,
      isPatching,
    }),
    [getFlags, patchEntry, isLoading, isPatching],
  );

  return (
    <UserMovieEntriesContext.Provider value={value}>
      {children}
    </UserMovieEntriesContext.Provider>
  );
}
