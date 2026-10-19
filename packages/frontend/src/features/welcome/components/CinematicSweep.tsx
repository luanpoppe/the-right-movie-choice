import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CinematicSweep({ delay = 0 }: { delay?: number }) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  if (shouldReduceMotion) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.1, delay, ease: EASE }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.1, delay: delay + 0.1, ease: EASE }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 hidden h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--primary)/0.1),transparent_70%)] md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: delay + 0.2, ease: EASE }}
      />
    </div>
  );
}
