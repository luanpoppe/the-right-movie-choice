import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Bookmark, Eye, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import { StringUtils } from "@/utils/string.utils";
import { cn } from "@/lib/utils";
import { MovieCardWatchedModal } from "./movie-card-watched-modal";

const UNDO_WINDOW_MS = 7000;

interface MovieCardListActionsProps {
  tmdbId: number;
}

interface WatchedUndoSnapshot {
  rating: number | null;
  watchedAt: string | null;
}

interface ListToggleButtonProps {
  label: string;
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ListToggleButton({
  label,
  isActive,
  isDisabled,
  onClick,
  children,
}: ListToggleButtonProps) {
  const activeClassName = isActive
    ? "text-primary bg-primary/10 hover:bg-primary/15"
    : "text-muted-foreground hover:text-foreground";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("gap-1.5", activeClassName)}
      aria-label={label}
      aria-pressed={isActive}
      disabled={isDisabled}
      onClick={onClick}
    >
      {children}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function GuestListActionsCta() {
  const location = useLocation();
  const currentUrl = `${location.pathname}${location.search}`;
  const encodedRedirect = encodeURIComponent(currentUrl);
  const loginPath = `/login?redirect=${encodedRedirect}`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>Save your lists by creating an account:</span>
      <Button variant="ghost" size="sm" asChild>
        <Link to={loginPath}>Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link to="/register">Create account</Link>
      </Button>
    </div>
  );
}

export function MovieCardListActions({ tmdbId }: MovieCardListActionsProps) {
  const { accessToken } = useAuth();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  if (!hasAccessToken) {
    return <GuestListActionsCta />;
  }

  return <AuthenticatedMovieCardListActions tmdbId={tmdbId} />;
}

function ListActionsLoadingState() {
  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <span>Loading your lists...</span>
    </div>
  );
}

function AuthenticatedMovieCardListActions({
  tmdbId,
}: MovieCardListActionsProps) {
  const { getFlags, patchEntry, isPatching, isLoading } = useUserMovieEntries();
  const [watchedModalOpen, setWatchedModalOpen] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<WatchedUndoSnapshot | null>(
    null,
  );
  const watchedSnapshotRef = useRef<WatchedUndoSnapshot | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current !== null) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return <ListActionsLoadingState />;
  }

  const flags = getFlags(tmdbId);
  const isCurrentlyPatching = isPatching(tmdbId);
  const areTogglesDisabled = isCurrentlyPatching;

  function clearUndoTimer() {
    if (undoTimerRef.current === null) {
      return;
    }

    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
  }

  function cancelPendingUndo() {
    clearUndoTimer();
    setUndoSnapshot(null);
  }

  function scheduleUndoExpiry() {
    clearUndoTimer();
    undoTimerRef.current = setTimeout(() => {
      undoTimerRef.current = null;
      setUndoSnapshot(null);
    }, UNDO_WINDOW_MS);
  }

  async function handleFavoriteToggle() {
    cancelPendingUndo();
    const nextFavorite = !flags.favorite;
    await patchEntry(tmdbId, { favorite: nextFavorite });
  }

  async function handleWatchlistToggle() {
    cancelPendingUndo();
    const nextInWatchlist = !flags.inWatchlist;
    await patchEntry(tmdbId, { inWatchlist: nextInWatchlist });
  }

  function handleWatchedToggle() {
    cancelPendingUndo();

    if (flags.watched) {
      watchedSnapshotRef.current = {
        rating: flags.rating,
        watchedAt: flags.watchedAt,
      };
    }

    setWatchedModalOpen(true);
  }

  function handleWatchedDeleted() {
    const deletedSnapshot = watchedSnapshotRef.current;
    if (deletedSnapshot === null) {
      return;
    }

    setUndoSnapshot(deletedSnapshot);
    scheduleUndoExpiry();
  }

  async function handleUndoDelete() {
    const snapshotToRestore = undoSnapshot;
    if (snapshotToRestore === null) {
      return;
    }

    cancelPendingUndo();
    await patchEntry(tmdbId, {
      watched: true,
      rating: snapshotToRestore.rating,
      watchedAt: snapshotToRestore.watchedAt,
    });
  }

  const favoriteIconClassName = flags.favorite
    ? "fill-primary text-primary"
    : undefined;
  const watchlistIconClassName = flags.inWatchlist
    ? "fill-primary text-primary"
    : undefined;
  const watchedIconClassName = flags.watched
    ? "text-primary"
    : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        <ListToggleButton
          label="Watched"
          isActive={flags.watched}
          isDisabled={areTogglesDisabled}
          onClick={handleWatchedToggle}
        >
          <Eye className={cn("h-4 w-4", watchedIconClassName)} />
        </ListToggleButton>

        <ListToggleButton
          label="Favorite"
          isActive={flags.favorite}
          isDisabled={areTogglesDisabled}
          onClick={handleFavoriteToggle}
        >
          <Heart className={cn("h-4 w-4", favoriteIconClassName)} />
        </ListToggleButton>

        <ListToggleButton
          label="Watchlist"
          isActive={flags.inWatchlist}
          isDisabled={areTogglesDisabled}
          onClick={handleWatchlistToggle}
        >
          <Bookmark className={cn("h-4 w-4", watchlistIconClassName)} />
        </ListToggleButton>

        {undoSnapshot !== null ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Watched removed</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={isCurrentlyPatching}
              onClick={handleUndoDelete}
            >
              Undo
            </Button>
          </div>
        ) : null}
      </div>

      <MovieCardWatchedModal
        tmdbId={tmdbId}
        open={watchedModalOpen}
        onOpenChange={setWatchedModalOpen}
        onDeleted={handleWatchedDeleted}
      />
    </>
  );
}
