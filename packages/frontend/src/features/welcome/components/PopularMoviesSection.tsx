import { PopularMovie } from "@/features/movies/dto/popular-movies.dto";
import { PopularMovieCard } from "@/features/movies/components/popular-movie-card";

interface PopularMoviesSectionProps {
  movies: PopularMovie[];
  isLoading: boolean;
}

export function PopularMoviesSection({
  movies,
  isLoading,
}: PopularMoviesSectionProps) {
  const hasMovies = movies.length > 0;

  if (isLoading || !hasMovies) {
    return null;
  }

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-border pb-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Popular now
        </h2>
        <span className="text-sm text-muted-foreground">
          Refreshed daily
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {movies.map((movie) => (
          <PopularMovieCard key={movie.tmdbId} movie={movie} />
        ))}
      </div>
    </section>
  );
}
