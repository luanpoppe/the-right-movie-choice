import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CinematicSweep() {
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
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, ease: EASE }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.08, ease: EASE }}
      />

      <motion.div
        className="absolute -inset-y-1/4 left-0 w-1/3 rotate-[16deg] bg-[linear-gradient(90deg,transparent,rgb(var(--primary)/0.12),transparent)] blur-2xl"
        initial={{ x: "-80%", opacity: 0 }}
        animate={{ x: ["-80%", "220%"], opacity: [0, 0.9, 0] }}
        transition={{ duration: 1.5, delay: 0.15, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--primary)/0.1),transparent_70%)]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 1, 0.6], scale: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      />
    </div>
  );
}
