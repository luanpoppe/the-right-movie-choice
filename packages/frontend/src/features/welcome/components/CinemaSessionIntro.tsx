import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

const PART_EASE = [0.76, 0, 0.24, 1] as const;
const REVEAL_MS = 900;
const TOTAL_MS = REVEAL_MS + 200;

interface CinemaSessionIntroProps {
  onDone: () => void;
}

export function CinemaSessionIntro({ onDone }: CinemaSessionIntroProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (shouldReduceMotion) {
      onDone();
      return;
    }

    const timer = window.setTimeout(onDone, TOTAL_MS);
    return () => clearTimeout(timer);
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

  const revealTransition = {
    duration: REVEAL_MS / 1000,
    ease: PART_EASE,
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <motion.div
        className="absolute inset-x-0 top-0 h-[51%] bg-background"
        initial={{ y: 0 }}
        animate={{ y: "-101%" }}
        transition={revealTransition}
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_45%,rgb(0_0_0/0.5)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      </motion.div>

      <motion.div
        className="absolute inset-x-0 bottom-0 h-[51%] bg-background"
        initial={{ y: 0 }}
        animate={{ y: "101%" }}
        transition={revealTransition}
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_100%,transparent_45%,rgb(0_0_0/0.5)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      </motion.div>

      <motion.button
        type="button"
        onClick={onDone}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="absolute bottom-6 right-6 z-10 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        Skip
      </motion.button>
    </div>
  );
}
