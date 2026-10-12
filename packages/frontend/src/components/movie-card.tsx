import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Star, Film } from "lucide-react";
import { Badge } from "./ui/badge";
import { MovieCardListActions } from "./movie-card-list-actions";
import { SingleMovieReccomendationEntity } from "@/features/movies/entities/movie-recommendation.entity";
import { TmdbPosterUtils } from "@/features/movies/utils/tmdb-poster.utils";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: SingleMovieReccomendationEntity;
}

interface MovieCardPosterProps {
  posterUrl: string | null;
  title: string;
}

export class MovieCardUtils {
  static resolvePosterUrl(
    movie: SingleMovieReccomendationEntity,
  ): string | null {
    const posterPath = movie.posterPath;
    const posterUrl = TmdbPosterUtils.resolvePosterUrl(posterPath ?? null);
    return posterUrl;
  }
}

function MovieCardPosterPlaceholder() {
  return (
    <div
      className={cn(
        "flex aspect-[2/3] w-full items-center justify-center",
        "bg-secondary text-muted-foreground",
      )}
      aria-hidden
    >
      <Film className="h-12 w-12 opacity-40" />
    </div>
  );
}

function MovieCardPoster({ posterUrl, title }: MovieCardPosterProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const hasPosterUrl = posterUrl !== null;
  const shouldShowImage = hasPosterUrl && !hasImageError;

  if (!shouldShowImage) {
    return <MovieCardPosterPlaceholder />;
  }

  function handleImageError() {
    setHasImageError(true);
  }

  return (
    <img
      src={posterUrl}
      alt={`Poster for ${title}`}
      className="aspect-[2/3] w-full object-cover"
      onError={handleImageError}
    />
  );
}

export function MovieCard({ movie }: MovieCardProps) {
  const tmdbId = movie.tmdbId;
  const hasTmdbId = tmdbId !== undefined;
  const posterUrl = MovieCardUtils.resolvePosterUrl(movie);
  const hasActors = movie.actors.length > 0;

  return (
    <Card className="overflow-hidden rounded-xl border-border bg-card transition-transform duration-300 hover:-translate-y-1.5">
      <div className="relative">
        <MovieCardPoster posterUrl={posterUrl} title={movie.title} />
        <span className="tnum absolute left-3 top-3 inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 text-xs font-medium text-primary backdrop-blur">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          {movie.imdbRating}
        </span>
      </div>

      <CardHeader className="space-y-1.5 pb-3">
        <CardTitle className="font-display text-lg leading-tight tracking-tight text-balance">
          {movie.title}
        </CardTitle>
        <CardDescription className="text-xs">
          {movie.director}{" "}
          <span className="tnum text-muted-foreground">
            · {movie.releaseYear} · {movie.durationInMinutes} min
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasActors && (
          <div className="flex flex-wrap gap-1.5">
            {movie.actors.map((actor) => (
              <Badge
                key={actor}
                variant="secondary"
                className="rounded-full px-3 text-xs"
              >
                {actor}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-sm leading-relaxed text-muted-foreground">
          {movie.synopsis}
        </p>

        <div className="border-t border-border pt-3">
          <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Why this movie?
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {movie.whySuggestion}
          </p>
        </div>

        {hasTmdbId && (
          <div className="border-t border-border pt-3">
            <MovieCardListActions tmdbId={tmdbId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
