import { Film, Star } from "lucide-react";
import { MovieCardListActions } from "@/components/movie-card-list-actions";
import { PopularMovie } from "@/features/movies/dto/popular-movies.dto";

interface PopularMovieCardProps {
  movie: PopularMovie;
}

function PopularMoviePoster({ movie }: PopularMovieCardProps) {
  const posterPath = movie.posterPath;

  if (posterPath === null) {
    return (
      <div className="flex aspect-[2/3] w-full items-center justify-center bg-secondary text-muted-foreground">
        <Film className="h-12 w-12 opacity-40" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={posterPath}
      alt={`Poster for ${movie.title}`}
      className="aspect-[2/3] w-full object-cover"
      loading="lazy"
    />
  );
}

function buildMetaLine(movie: PopularMovie): string {
  const parts: string[] = [];

  if (movie.year !== null) {
    parts.push(String(movie.year));
  }
  if (movie.runtimeMinutes !== null) {
    parts.push(`${movie.runtimeMinutes} min`);
  }

  return parts.join(" · ");
}

export function PopularMovieCard({ movie }: PopularMovieCardProps) {
  const hasRating = movie.voteAverage !== null;
  const hasDirectors = movie.directors.length > 0;
  const metaLine = buildMetaLine(movie);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card transition-transform duration-300 hover:-translate-y-1.5">
      <div className="relative">
        <PopularMoviePoster movie={movie} />
        {hasRating && (
          <span className="tnum absolute left-3 top-3 inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 text-xs font-medium text-primary backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />
            {movie.voteAverage}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-display text-base font-semibold leading-tight tracking-tight text-balance">
            {movie.title}
          </h3>
          {metaLine !== "" && (
            <p className="tnum mt-1 text-xs text-muted-foreground">
              {metaLine}
            </p>
          )}
        </div>

        {hasDirectors && (
          <p className="text-xs text-muted-foreground">
            Directed by {movie.directors.join(", ")}
          </p>
        )}

        <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          {movie.overview}
        </p>

        <div className="border-t border-border pt-3">
          <MovieCardListActions tmdbId={movie.tmdbId} />
        </div>
      </div>
    </article>
  );
}
