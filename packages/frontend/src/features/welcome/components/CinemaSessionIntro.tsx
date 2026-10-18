import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

const LAMP_FLICKER_MS = 420;
const IRIS_MS = 700;
const TOTAL_MS = LAMP_FLICKER_MS + IRIS_MS + 130;

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

  const holdRatio = LAMP_FLICKER_MS / TOTAL_MS;

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background"
      initial={{ clipPath: "circle(140% at 50% 42%)" }}
      animate={{
        clipPath: [
          "circle(140% at 50% 42%)",
          "circle(140% at 50% 42%)",
          "circle(0% at 50% 42%)",
        ],
      }}
      transition={{
        duration: TOTAL_MS / 1000,
        times: [0, holdRatio, 1],
        ease: ["linear", [0.83, 0, 0.17, 1]],
      }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-foreground"
        animate={{ opacity: [0, 0.14, 0, 0.1, 0, 0.16, 0] }}
        transition={{ duration: LAMP_FLICKER_MS / 1000, ease: "linear" }}
      />

      <div className="absolute left-1/2 top-[42%] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />
      <div className="absolute left-1/2 top-[42%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--primary)/0.12),transparent_70%)]" />

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
