import { motion, useReducedMotion } from "motion/react";

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

const BULB_COUNT = 18;

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

function MarqueeBulbs({ introDelay }: { introDelay: number }) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1.5 flex justify-between px-1"
    >
      {Array.from({ length: BULB_COUNT }, (_, index) => (
        <motion.span
          key={index}
          className="h-1 w-1 rounded-full bg-primary/80 shadow-[0_0_6px_rgb(var(--primary)/0.7)]"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={
            shouldReduceMotion ? undefined : { opacity: [0, 1, 0.3, 1] }
          }
          transition={{
            duration: 0.5,
            delay: introDelay + index * 0.02,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

interface GenreMarqueeProps {
  introDelay?: number;
}

export function GenreMarquee({ introDelay = 0 }: GenreMarqueeProps) {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-border py-4 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
    >
      <MarqueeBulbs introDelay={introDelay} />
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <GenreStrip />
        <GenreStrip />
      </div>
    </div>
  );
}
