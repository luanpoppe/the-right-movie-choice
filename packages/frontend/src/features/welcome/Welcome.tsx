import { useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence } from "motion/react";

import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Form } from "./components/Form";
import { GenreMarquee } from "./components/GenreMarquee";
import { FilmLeaderIntro } from "./components/FilmLeaderIntro";
import { LandingIntroDevToggle } from "./components/LandingIntroDevToggle";
import { PopularMoviesSection } from "./components/PopularMoviesSection";
import { usePopularMovies } from "@/features/movies/hooks/use-popular-movies.hook";
import {
  FilmLeaderIntroUtils,
  LandingIntroMode,
  LandingIntroModeUtils,
} from "./utils/landing-intro-mode.utils";

const LEADER_INTRO_DELAY_S = 1.7;

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
  const prefersReducedMotion = LandingIntroModeUtils.prefersReducedMotion();
  const shouldReduceMotion = isPreview ? false : prefersReducedMotion;

  const [mode, setMode] = useState<LandingIntroMode>(explicitMode ?? "cinema");
  const [isLeaderPlaying, setIsLeaderPlaying] = useState(
    () =>
      (explicitMode ?? "cinema") === "leader" &&
      !shouldReduceMotion &&
      (isPreview || !FilmLeaderIntroUtils.hasSeen()),
  );
  const [leaderNonce, setLeaderNonce] = useState(0);
  const [heroNonce, setHeroNonce] = useState(0);

  const introDelay = isLeaderPlaying ? LEADER_INTRO_DELAY_S : 0;
  const withSweep = mode === "cinema" && !shouldReduceMotion;

  function handleLeaderDone() {
    FilmLeaderIntroUtils.markSeen();
    setIsLeaderPlaying(false);
  }

  function handleSelectMode(nextMode: LandingIntroMode) {
    setMode(nextMode);
    setHeroNonce((nonce) => nonce + 1);

    if (nextMode === "leader") {
      setIsLeaderPlaying(true);
      setLeaderNonce((nonce) => nonce + 1);
      return;
    }

    setIsLeaderPlaying(false);
  }

  function handleReplay() {
    if (mode === "leader") {
      setIsLeaderPlaying(true);
      setLeaderNonce((nonce) => nonce + 1);
      return;
    }

    setHeroNonce((nonce) => nonce + 1);
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16">
      <AnimatePresence>
        {isLeaderPlaying ? (
          <FilmLeaderIntro key={leaderNonce} onDone={handleLeaderDone} />
        ) : null}
      </AnimatePresence>

      <Hero
        key={heroNonce}
        heroPosters={heroPosters}
        introDelay={introDelay}
        withSweep={withSweep}
      />

      <div className="mt-12">
        <GenreMarquee introDelay={introDelay} />
      </div>

      <div className="mt-10 sm:mt-12">
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

      {import.meta.env.DEV ? (
        <LandingIntroDevToggle
          mode={mode}
          onSelect={handleSelectMode}
          onReplay={handleReplay}
        />
      ) : null}
    </div>
  );
}
