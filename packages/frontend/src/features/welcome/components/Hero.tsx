import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const TILE_CLASS =
  "absolute aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-gradient-to-b from-secondary to-card shadow-2xl shadow-black/40 sm:w-44";

function PosterTexture() {
  return (
    <>
      <div className="absolute inset-0 opacity-[0.12] bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,hsl(0_0%_50%/0.5)_10px,hsl(0_0%_50%/0.5)_11px)]" />
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-primary/25" />
    </>
  );
}

function TileVisual({ posterPath }: { posterPath: string | null }) {
  if (posterPath !== null) {
    return (
      <img
        src={posterPath}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return <PosterTexture />;
}

function HeroPanel({ reduce, posters }: { reduce: boolean; posters: (string | null)[] }) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 80, damping: 18, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 80, damping: 18, mass: 0.4 });

  const leftTransform = useTransform(
    () =>
      `translate3d(${x.get() * 26}px, ${y.get() * 22}px, 0) rotate(${x.get() * 2 - 6}deg)`,
  );
  const centerTransform = useTransform(
    () =>
      `translate3d(${x.get() * 42}px, ${y.get() * 34}px, 0) rotate(${x.get() * -1.5}deg)`,
  );
  const rightTransform = useTransform(
    () =>
      `translate3d(${x.get() * 20}px, ${y.get() * 18}px, 0) rotate(${x.get() * 2 + 6}deg)`,
  );

  useEffect(() => {
    if (reduce) {
      return;
    }

    const canHover = window.matchMedia("(hover: hover)").matches;
    if (!canHover) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      rawX.set(event.clientX / window.innerWidth - 0.5);
      rawY.set(event.clientY / window.innerHeight - 0.5);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [reduce, rawX, rawY]);

  return (
    <div className="relative hidden h-[380px] md:block">
      <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(55%_55%_at_50%_45%,rgb(var(--primary)/0.14),transparent_70%)]" />

      <motion.div
        className="relative h-full"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
      >
        <motion.div
          style={{ transform: leftTransform }}
          className={`${TILE_CLASS} left-[2%] top-10`}
        >
          <TileVisual posterPath={posters[0] ?? null} />
        </motion.div>

        <motion.div
          style={{ transform: centerTransform }}
          className={`${TILE_CLASS} left-[30%] top-0 z-20`}
        >
          <TileVisual posterPath={posters[1] ?? null} />
        </motion.div>

        <motion.div
          style={{ transform: rightTransform }}
          className={`${TILE_CLASS} left-[58%] top-12`}
        >
          <TileVisual posterPath={posters[2] ?? null} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export function Hero({
  heroPosters = [],
}: {
  heroPosters?: (string | null)[];
}) {
  const reduce = useReducedMotion() ?? false;

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: EASE },
  });

  return (
    <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
      <div>
        <motion.p
          {...rise(0)}
          className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-primary"
        >
          Tonight's programme
        </motion.p>
        <motion.h1
          {...rise(0.06)}
          className="mt-4 font-display text-4xl font-bold leading-[0.98] tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl"
        >
          Find the film that{" "}
          <em className="italic text-primary">fits the mood</em>, not the
          algorithm.
        </motion.h1>
        <motion.p
          {...rise(0.12)}
          className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          Tell us the feeling you're after. We return three films worth your
          evening, each with the reason it belongs.
        </motion.p>
      </div>

      <HeroPanel reduce={reduce} posters={heroPosters} />
    </div>
  );
}
