import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  {
    title: "AI-powered",
    description:
      "Recommendations matched to your preferences and mood, not just genre tags.",
  },
  {
    title: "Curated selection",
    description:
      "Three films, each with the details that matter: director, cast, runtime and where to watch.",
  },
  {
    title: "Interactive chat",
    description:
      "Refine the search with follow-up questions until the pick is right.",
  },
];

export function Features() {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
      {FEATURES.map((feature, index) => (
        <motion.div
          key={feature.title}
          className="border-t border-border pt-5"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: index * 0.06, ease: EASE }}
        >
          <span className="font-display text-xs font-semibold tracking-[0.1em] text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-3 text-base font-semibold tracking-tight">
            {feature.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
