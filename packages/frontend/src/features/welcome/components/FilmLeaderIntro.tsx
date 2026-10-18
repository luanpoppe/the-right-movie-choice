import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const COUNTDOWN_START = 3;
const STEP_MS = 400;
const COUNTDOWN_MS = STEP_MS * COUNTDOWN_START;

interface FilmLeaderIntroProps {
  onDone: () => void;
}

export function FilmLeaderIntro({ onDone }: FilmLeaderIntroProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [count, setCount] = useState(COUNTDOWN_START);

  useEffect(() => {
    if (shouldReduceMotion) {
      onDone();
      return;
    }

    const timers = [
      window.setTimeout(() => setCount(2), STEP_MS),
      window.setTimeout(() => setCount(1), STEP_MS * 2),
      window.setTimeout(() => onDone(), COUNTDOWN_MS),
    ];

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [shouldReduceMotion, onDone]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-background"
      initial={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="grid place-items-center gap-6">
        <div className="relative grid h-40 w-40 place-items-center">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
          <span className="absolute inset-0 rounded-full border border-border" />

          <motion.span
            className="absolute left-1/2 top-1/2 h-20 w-px origin-top bg-primary"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: COUNTDOWN_MS / 1000, ease: "linear" }}
          />

          <motion.span
            key={count}
            className="tnum relative font-display text-6xl font-bold text-primary"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {count}
          </motion.span>
        </div>

        <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          The Right Movie Choice
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="absolute bottom-6 right-6 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        Skip
      </button>
    </motion.div>
  );
}
