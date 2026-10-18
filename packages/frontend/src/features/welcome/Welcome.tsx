import { useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";

import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Form } from "./components/Form";
import { GenreMarquee } from "./components/GenreMarquee";
import { CinemaSessionIntro } from "./components/CinemaSessionIntro";
import { FilmLeaderIntro } from "./components/FilmLeaderIntro";
import { LandingIntroDevToggle } from "./components/LandingIntroDevToggle";
import { PopularMoviesSection } from "./components/PopularMoviesSection";
import { usePopularMovies } from "@/features/movies/hooks/use-popular-movies.hook";
import {
  FilmLeaderIntroUtils,
  LandingIntroMode,
  LandingIntroModeUtils,
} from "./utils/landing-intro-mode.utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const PLAY_INTRO_ON_EVERY_LOAD = true;

const INTRO_DELAY_S: Record<LandingIntroMode, number> = {
  cinema: 1.2,
  leader: 1.7,
};

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
  const location = useLocation();
  const { movies: popularMovies, isLoading: isLoadingPopular } =
    usePopularMovies();
  const heroPosters = popularMovies
    .slice(0, 3)
    .map((movie) => movie.posterPath);
  const popularSectionMovies = popularMovies.slice(3, 9);

  const explicitMode = LandingIntroModeUtils.readExplicit(location.search);
  const isPreview = explicitMode !== null;
  const shouldReduceMotion = isPreview
    ? false
    : LandingIntroModeUtils.prefersReducedMotion();

  const [mode, setMode] = useState<LandingIntroMode>(explicitMode ?? "cinema");
  const [isIntroPlaying, setIsIntroPlaying] = useState(
    () =>
      !shouldReduceMotion &&
      (isPreview ||
        PLAY_INTRO_ON_EVERY_LOAD ||
        !FilmLeaderIntroUtils.hasSeen()),
  );
  const [introNonce, setIntroNonce] = useState(0);
  const [heroNonce, setHeroNonce] = useState(0);

  const introDelay = isIntroPlaying ? INTRO_DELAY_S[mode] : 0;
  const withSweep = mode === "cinema" && !shouldReduceMotion;

  function handleIntroDone() {
    FilmLeaderIntroUtils.markSeen();
    setIsIntroPlaying(false);
  }

  function playIntro(nextMode: LandingIntroMode) {
    setMode(nextMode);
    setHeroNonce((nonce) => nonce + 1);
    setIntroNonce((nonce) => nonce + 1);
    setIsIntroPlaying(true);
  }

  function handleReplay() {
    playIntro(mode);
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16">
      <AnimatePresence>
        {isIntroPlaying ? (
          mode === "cinema" ? (
            <CinemaSessionIntro key={introNonce} onDone={handleIntroDone} />
          ) : (
            <FilmLeaderIntro key={introNonce} onDone={handleIntroDone} />
          )
        ) : null}
      </AnimatePresence>

      <Hero
        key={heroNonce}
        heroPosters={heroPosters}
        introDelay={introDelay}
        withSweep={withSweep}
      />

      <motion.div
        className="mt-12"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: introDelay + 0.95, ease: EASE }}
      >
        <GenreMarquee />
      </motion.div>

      <motion.div
        className="mt-10 sm:mt-12"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
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
        <LandingIntroDevToggle
          mode={mode}
          onSelect={playIntro}
          onReplay={handleReplay}
        />
      ) : null}
    </div>
  );
}
