import { useState } from "react";
import { Calendar, Film, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MovieCardListActions } from "@/components/movie-card-list-actions";
import { UserMovieEntryEntity } from "@/features/movies/entities/user-movie-entry.entity";
import { TmdbPosterUtils } from "@/features/movies/utils/tmdb-poster.utils";
import { cn } from "@/lib/utils";
import { Utils } from "@/utils/utils";

interface LibraryMovieCardProps {
  entry: UserMovieEntryEntity;
  showWatchedDetails?: boolean;
}

interface LibraryMovieCardPosterProps {
  posterUrl: string | null;
  title: string;
}

export class LibraryMovieCardUtils {
  static resolveTitle(entry: UserMovieEntryEntity): string {
    const movie = entry.movie;
    if (movie == null) {
      return `Filme #${entry.tmdbId}`;
    }

    return movie.title;
  }

  static resolveYear(entry: UserMovieEntryEntity): number | null {
    const movie = entry.movie;
    if (movie == null) {
      return null;
    }

    return movie.year;
  }

  static resolvePosterUrl(entry: UserMovieEntryEntity): string | null {
    const movie = entry.movie;
    if (movie == null) {
      return null;
    }

    const posterPath = movie.posterPath;
    const posterUrl = TmdbPosterUtils.resolvePosterUrl(posterPath);
    return posterUrl;
  }

  static formatWatchedAt(watchedAt: string | null): string | null {
    if (watchedAt == null) {
      return null;
    }

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(watchedAt);
    if (dateOnlyMatch) {
      const year = dateOnlyMatch[1];
      const month = dateOnlyMatch[2];
      const day = dateOnlyMatch[3];
      return `${day}/${month}/${year}`;
    }

    const parsedDate = new Date(watchedAt);
    const isInvalidDate = Number.isNaN(parsedDate.getTime());
    if (isInvalidDate) {
      return null;
    }

    const formattedDate = Utils.Date.showDateInSPTime(parsedDate);
    return formattedDate;
  }
}

function LibraryMoviePosterPlaceholder() {
  return (
    <div
      className={cn(
        "flex aspect-[2/3] w-full items-center justify-center",
        "bg-muted text-muted-foreground",
      )}
      aria-hidden
    >
      <Film className="h-12 w-12 opacity-40" />
    </div>
  );
}

function LibraryMovieCardPoster({
  posterUrl,
  title,
}: LibraryMovieCardPosterProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const hasPosterUrl = posterUrl !== null;
  const shouldShowImage = hasPosterUrl && !hasImageError;

  if (!shouldShowImage) {
    return <LibraryMoviePosterPlaceholder />;
  }

  function handleImageError() {
    setHasImageError(true);
  }

  return (
    <img
      src={posterUrl}
      alt={`Poster de ${title}`}
      className="aspect-[2/3] w-full object-cover"
      onError={handleImageError}
    />
  );
}

function LibraryMovieWatchedDetails({
  entry,
}: {
  entry: UserMovieEntryEntity;
}) {
  const rating = entry.rating;
  const hasRating = rating !== null;
  const formattedWatchedAt = LibraryMovieCardUtils.formatWatchedAt(
    entry.watchedAt,
  );
  const hasWatchedAt = formattedWatchedAt !== null;
  const hasDetails = hasRating || hasWatchedAt;

  if (!hasDetails) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {hasRating && (
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="font-medium">{rating}</span>
        </div>
      )}

      {hasWatchedAt && (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formattedWatchedAt}</span>
        </div>
      )}
    </div>
  );
}

export function LibraryMovieCard({
  entry,
  showWatchedDetails = false,
}: LibraryMovieCardProps) {
  const title = LibraryMovieCardUtils.resolveTitle(entry);
  const year = LibraryMovieCardUtils.resolveYear(entry);
  const posterUrl = LibraryMovieCardUtils.resolvePosterUrl(entry);
  const hasYear = year !== null;

  return (
    <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      <LibraryMovieCardPoster posterUrl={posterUrl} title={title} />

      <CardHeader className="space-y-1 p-4 pb-2">
        <CardTitle className="line-clamp-2 text-base leading-tight">
          {title}
        </CardTitle>
        {hasYear && (
          <CardDescription className="text-xs">{year}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0">
        {showWatchedDetails && <LibraryMovieWatchedDetails entry={entry} />}

        <div className="border-t border-border/50 pt-3">
          <MovieCardListActions tmdbId={entry.tmdbId} />
        </div>
      </CardContent>
    </Card>
  );
}
