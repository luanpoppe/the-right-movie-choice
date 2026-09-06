import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Bookmark, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import { StringUtils } from "@/utils/string.utils";
import { cn } from "@/lib/utils";
import { MovieCardWatchedModal } from "./movie-card-watched-modal";

interface MovieCardListActionsProps {
  tmdbId: number;
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
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>Salve suas listas criando uma conta:</span>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/login">Entrar</Link>
      </Button>
      <Button size="sm" asChild>
        <Link to="/register">Criar conta</Link>
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

function AuthenticatedMovieCardListActions({
  tmdbId,
}: MovieCardListActionsProps) {
  const { getFlags, patchEntry, isPatching } = useUserMovieEntries();
  const flags = getFlags(tmdbId);
  const isCurrentlyPatching = isPatching(tmdbId);
  const [watchedModalOpen, setWatchedModalOpen] = useState(false);

  async function handleFavoriteToggle() {
    const nextFavorite = !flags.favorite;
    await patchEntry(tmdbId, { favorite: nextFavorite });
  }

  async function handleWatchlistToggle() {
    const nextInWatchlist = !flags.inWatchlist;
    await patchEntry(tmdbId, { inWatchlist: nextInWatchlist });
  }

  async function handleWatchedToggle() {
    if (flags.watched) {
      await patchEntry(tmdbId, { watched: false });
      return;
    }

    setWatchedModalOpen(true);
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
          label="Assistido"
          isActive={flags.watched}
          isDisabled={isCurrentlyPatching}
          onClick={handleWatchedToggle}
        >
          <Eye className={cn("h-4 w-4", watchedIconClassName)} />
        </ListToggleButton>

        <ListToggleButton
          label="Favorito"
          isActive={flags.favorite}
          isDisabled={isCurrentlyPatching}
          onClick={handleFavoriteToggle}
        >
          <Heart className={cn("h-4 w-4", favoriteIconClassName)} />
        </ListToggleButton>

        <ListToggleButton
          label="Watchlist"
          isActive={flags.inWatchlist}
          isDisabled={isCurrentlyPatching}
          onClick={handleWatchlistToggle}
        >
          <Bookmark className={cn("h-4 w-4", watchlistIconClassName)} />
        </ListToggleButton>
      </div>

      <MovieCardWatchedModal
        tmdbId={tmdbId}
        open={watchedModalOpen}
        onOpenChange={setWatchedModalOpen}
      />
    </>
  );
}
