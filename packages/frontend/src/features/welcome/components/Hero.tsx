import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import { CinematicSweep } from "./CinematicSweep";
import { MaskRise } from "./MaskRise";

const EASE = [0.16, 1, 0.3, 1] as const;

const TILE_FRAME_CLASS = "absolute w-40 sm:w-44";
const TILE_VISUAL_CLASS =
  "relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-gradient-to-b from-secondary to-card shadow-2xl shadow-black/40";

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

function HeroPanel({
  reduce,
  animateEntrance,
  posters,
  introDelay,
}: {
  reduce: boolean;
  animateEntrance: boolean;
  posters: (string | null)[];
  introDelay: number;
}) {
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

  const tiles = [
    {
      frame: "left-[2%] top-10",
      transform: leftTransform,
      poster: posters[0] ?? null,
    },
    {
      frame: "left-[30%] top-0 z-20",
      transform: centerTransform,
      poster: posters[1] ?? null,
    },
    {
      frame: "left-[58%] top-12",
      transform: rightTransform,
      poster: posters[2] ?? null,
    },
  ];

  return (
    <div className="relative hidden h-[380px] md:block">
      <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(55%_55%_at_50%_45%,rgb(var(--primary)/0.14),transparent_70%)]" />

      {tiles.map((tile, index) => (
        <motion.div
          key={tile.frame}
          className={cn(TILE_FRAME_CLASS, tile.frame)}
          initial={
            reduce || !animateEntrance ? false : { opacity: 0, y: 28, scale: 0.96 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: introDelay + 0.5 + index * 0.14,
            ease: EASE,
          }}
        >
          <motion.div
            style={{ transform: tile.transform }}
            className={TILE_VISUAL_CLASS}
          >
            <TileVisual posterPath={tile.poster} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

export function Hero({
  heroPosters = [],
  introDelay = 0,
  withSweep = false,
  animateEntrance = true,
}: {
  heroPosters?: (string | null)[];
  introDelay?: number;
  withSweep?: boolean;
  animateEntrance?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const shouldAnimateContent = animateEntrance && !reduce;

  const rise = (delay: number) => ({
    initial: shouldAnimateContent ? { opacity: 0, y: 18 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, delay: introDelay + delay, ease: EASE },
  });

  return (
    <div className="relative isolate grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
      {withSweep ? <CinematicSweep delay={introDelay} /> : null}

      <div>
        <motion.p
          {...rise(0)}
          className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-primary"
        >
          Tonight's programme
        </motion.p>

        <MaskRise
          delay={introDelay + 0.14}
          className="-mb-[0.12em] mt-4 pb-[0.12em]"
        >
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl">
            Find the film that{" "}
            <em
              className="italic text-primary"
              style={{ textShadow: "0 0 18px rgb(var(--primary) / 0.35)" }}
            >
              fits the mood
            </em>
            , not the algorithm.
          </h1>
        </MaskRise>

        <motion.p
          {...rise(0.36)}
          className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          Tell us the feeling you're after. We return three films worth your
          evening, each with the reason it belongs.
        </motion.p>
      </div>

      <HeroPanel
        reduce={reduce}
        animateEntrance={animateEntrance}
        posters={heroPosters}
        introDelay={introDelay}
      />
    </div>
  );
}
