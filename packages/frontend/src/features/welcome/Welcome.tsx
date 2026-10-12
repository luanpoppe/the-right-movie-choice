import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Form } from "./components/Form";
import { GenreMarquee } from "./components/GenreMarquee";
import { PopularMoviesSection } from "./components/PopularMoviesSection";
import { usePopularMovies } from "@/features/movies/hooks/use-popular-movies.hook";

interface WelcomeProps {
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isGuestLocked?: boolean;
  excludeWatched: boolean;
  onExcludeWatchedChange: (value: boolean) => void;
  hasAccessToken: boolean;
}

export function Welcome({
  isLoading,
  handleSubmit,
  isGuestLocked = false,
  excludeWatched,
  onExcludeWatchedChange,
  hasAccessToken,
}: WelcomeProps) {
  const { movies: popularMovies, isLoading: isLoadingPopular } =
    usePopularMovies();
  const heroPosters = popularMovies
    .slice(0, 3)
    .map((movie) => movie.posterPath);
  const popularSectionMovies = popularMovies.slice(3, 6);

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16">
      <Hero heroPosters={heroPosters} />

      <div className="mt-12">
        <GenreMarquee />
      </div>

      <div className="mx-auto mt-10 max-w-[680px] sm:mt-12">
        <Form
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          isGuestLocked={isGuestLocked}
          excludeWatched={excludeWatched}
          onExcludeWatchedChange={onExcludeWatchedChange}
          hasAccessToken={hasAccessToken}
        />
      </div>

      <div className="mt-16">
        <Features />
      </div>

      <PopularMoviesSection
        movies={popularSectionMovies}
        isLoading={isLoadingPopular}
      />
    </div>
  );
}
