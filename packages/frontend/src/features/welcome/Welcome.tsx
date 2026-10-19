import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Form } from "./components/Form";
import { GenreMarquee } from "./components/GenreMarquee";
import { CinemaSessionIntro } from "./components/CinemaSessionIntro";
import { PopularMoviesSection } from "./components/PopularMoviesSection";
import { usePopularMovies } from "@/features/movies/hooks/use-popular-movies.hook";
import { LandingIntroUtils } from "./utils/landing-intro.utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const INTRO_DELAY_S = 0.8;

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
  const popularSectionMovies = popularMovies.slice(3, 9);

  const shouldReduceMotion = LandingIntroUtils.prefersReducedMotion();
  const [animateEntrance] = useState(
    () =>
      !shouldReduceMotion && LandingIntroUtils.consumeEntranceAnimation(),
  );
  const [isIntroPlaying, setIsIntroPlaying] = useState(animateEntrance);

  const introDelay = animateEntrance ? INTRO_DELAY_S : 0;
  const isContentAnimating = animateEntrance;

  function handleIntroDone() {
    setIsIntroPlaying(false);
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-12 pt-7 sm:px-6 sm:py-16">
      <AnimatePresence>
        {isIntroPlaying ? <CinemaSessionIntro onDone={handleIntroDone} /> : null}
      </AnimatePresence>

      <Hero
        heroPosters={heroPosters}
        introDelay={introDelay}
        withSweep={isContentAnimating}
        animateEntrance={animateEntrance}
      />

      <motion.div
        className="mt-12"
        initial={isContentAnimating ? { opacity: 0, y: 16 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: introDelay + 0.95, ease: EASE }}
      >
        <GenreMarquee />
      </motion.div>

      <motion.div
        className="mt-10 sm:mt-12"
        initial={isContentAnimating ? { opacity: 0, y: 16 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: introDelay + 1.2, ease: EASE }}
      >
        <Form
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          isGuestLocked={isGuestLocked}
          excludeWatched={excludeWatched}
          onExcludeWatchedChange={onExcludeWatchedChange}
          hasAccessToken={hasAccessToken}
        />
      </motion.div>

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
