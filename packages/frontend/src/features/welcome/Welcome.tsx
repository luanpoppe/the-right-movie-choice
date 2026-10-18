import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Form } from "./components/Form";
import { GenreMarquee } from "./components/GenreMarquee";
import { CinemaSessionIntro } from "./components/CinemaSessionIntro";
import { LandingIntroReplayButton } from "./components/LandingIntroReplayButton";
import { PopularMoviesSection } from "./components/PopularMoviesSection";
import { usePopularMovies } from "@/features/movies/hooks/use-popular-movies.hook";
import { LandingIntroUtils } from "./utils/landing-intro.utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const PLAY_INTRO_ON_EVERY_LOAD = true;
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
  const [animateEntrance, setAnimateEntrance] = useState(() =>
    LandingIntroUtils.consumeEntranceAnimation(),
  );
  const shouldPlayIntro =
    animateEntrance &&
    !shouldReduceMotion &&
    (PLAY_INTRO_ON_EVERY_LOAD || !LandingIntroUtils.hasSeen());

  const [isIntroPlaying, setIsIntroPlaying] = useState(shouldPlayIntro);
  const [introDelay, setIntroDelay] = useState(
    shouldPlayIntro ? INTRO_DELAY_S : 0,
  );
  const [introNonce, setIntroNonce] = useState(0);
  const [heroNonce, setHeroNonce] = useState(0);

  const isContentAnimating = animateEntrance && !shouldReduceMotion;

  function handleIntroDone() {
    LandingIntroUtils.markSeen();
    setIsIntroPlaying(false);
  }

  function handleReplay() {
    setAnimateEntrance(true);
    setHeroNonce((nonce) => nonce + 1);
    setIntroNonce((nonce) => nonce + 1);
    setIsIntroPlaying(true);
    setIntroDelay(INTRO_DELAY_S);
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16">
      <AnimatePresence>
        {isIntroPlaying ? (
          <CinemaSessionIntro key={introNonce} onDone={handleIntroDone} />
        ) : null}
      </AnimatePresence>

      <Hero
        key={heroNonce}
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

      {import.meta.env.DEV ? (
        <LandingIntroReplayButton onReplay={handleReplay} />
      ) : null}
    </div>
  );
}
