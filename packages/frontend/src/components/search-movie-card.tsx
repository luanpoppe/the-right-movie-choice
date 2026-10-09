import { useState } from "react";
import { Calendar, Film } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MovieCardListActions } from "@/components/movie-card-list-actions";
import type { MovieSearchHit } from "@/features/movies/dto/movie-catalog-search.dto";
import { TmdbPosterUtils } from "@/features/movies/utils/tmdb-poster.utils";
import { cn } from "@/lib/utils";

interface SearchMovieCardProps {
  hit: MovieSearchHit;
}

interface SearchMovieCardPosterProps {
  posterUrl: string | null;
  title: string;
}

const MISSING_YEAR_LABEL = "—";

function SearchMovieCardPosterPlaceholder() {
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

function SearchMovieCardPoster({ posterUrl, title }: SearchMovieCardPosterProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const hasPosterUrl = posterUrl !== null;
  const shouldShowImage = hasPosterUrl && !hasImageError;

  if (!shouldShowImage) {
    return <SearchMovieCardPosterPlaceholder />;
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

export function SearchMovieCard({ hit }: SearchMovieCardProps) {
  const posterUrl = TmdbPosterUtils.resolvePosterUrl(hit.posterPath);
  const hasYear = hit.year !== null;
  const yearLabel = hasYear ? String(hit.year) : MISSING_YEAR_LABEL;

  return (
    <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      <SearchMovieCardPoster posterUrl={posterUrl} title={hit.title} />

      <CardHeader className="space-y-1 p-4 pb-2">
        <CardTitle className="line-clamp-2 text-base leading-tight">
          {hit.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5" />
          <span>{yearLabel}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0">
        <p className="line-clamp-4 text-sm text-muted-foreground leading-relaxed">
          {hit.overview}
        </p>

        <div className="border-t border-border/50 pt-3">
          <MovieCardListActions tmdbId={hit.id} />
        </div>
      </CardContent>
    </Card>
  );
}
