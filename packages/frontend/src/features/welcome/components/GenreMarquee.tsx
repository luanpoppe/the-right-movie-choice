import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Sci-Fi",
  "Documentary",
  "Romance",
  "Thriller",
  "Animation",
  "Crime",
  "Adventure",
  "Mystery",
];

function GenreStrip() {
  return (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {GENRES.map((genre) => (
        <span
          key={genre}
          className="whitespace-nowrap font-display text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          {genre}
        </span>
      ))}
    </div>
  );
}

interface GenreMarqueeProps {
  introDelay?: number;
}

export function GenreMarquee({ introDelay = 0 }: GenreMarqueeProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      aria-hidden
      className="overflow-hidden border-y border-border py-4 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: introDelay + 0.3, ease: EASE }}
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <GenreStrip />
        <GenreStrip />
      </div>
    </motion.div>
  );
}
