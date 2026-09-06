import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Star, Calendar, Clock, Film } from "lucide-react";
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
        "bg-muted text-muted-foreground",
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

  return (
    <Card className="overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

      <MovieCardPoster posterUrl={posterUrl} title={movie.title} />

      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-lg leading-tight text-balance">
          {movie.title}
        </CardTitle>
        <CardDescription className="text-xs">
          Directed by {movie.director}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {movie.actors.map((a) => (
            <Badge
              key={a}
              variant="secondary"
              className="text-xs rounded-full px-3"
            >
              {a}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="rounded-full bg-accent/20 p-1">
              <Star className="w-3 h-3 fill-accent text-accent" />
            </div>
            <span className="font-medium">{movie.imdbRating}/10</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{movie.releaseYear}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{movie.durationInMinutes}min</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {movie.synopsis}
        </p>

        {hasTmdbId && (
          <div className="pt-3 border-t border-border/50">
            <MovieCardListActions tmdbId={tmdbId} />
          </div>
        )}

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-accent" />
            <p className="text-xs font-semibold text-primary">
              Why this movie?
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {movie.whySuggestion}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
