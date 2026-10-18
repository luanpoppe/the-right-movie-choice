import { Fragment, useEffect } from "react";
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

interface HeadlineToken {
  text: string;
  emphasis?: boolean;
}

const HEADLINE_TOKENS: HeadlineToken[] = [
  { text: "Find" },
  { text: "the" },
  { text: "film" },
  { text: "that" },
  { text: "fits", emphasis: true },
  { text: "the", emphasis: true },
  { text: "mood,", emphasis: true },
  { text: "not" },
  { text: "the" },
  { text: "algorithm." },
];

function PosterTexture() {
  return (
    <>
      <div className="absolute inset-0 opacity-[0.12] bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,hsl(0_0%_50%/0.5)_10px,hsl(0_0%_50%/0.5)_11px)]" />
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-primary/25" />
    </>
  );
}

function FilmStripEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-x-0 flex justify-between px-1",
        position === "top" ? "top-0.5" : "bottom-0.5",
      )}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          className="h-1.5 w-1 rounded-[2px] bg-black/55"
        />
      ))}
    </div>
  );
}

function TileVisual({ posterPath }: { posterPath: string | null }) {
  return (
    <>
      {posterPath !== null ? (
        <img
          src={posterPath}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <PosterTexture />
      )}
      <FilmStripEdge position="top" />
      <FilmStripEdge position="bottom" />
    </>
  );
}

function HeroPanel({
  reduce,
  posters,
  introDelay,
}: {
  reduce: boolean;
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
    { frame: "left-[2%] top-10", transform: leftTransform, poster: posters[0] ?? null },
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
          initial={reduce ? false : { opacity: 0, x: 64 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.6,
            delay: introDelay + 0.2 + index * 0.09,
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
}: {
  heroPosters?: (string | null)[];
  introDelay?: number;
  withSweep?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay: introDelay + delay, ease: EASE },
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

        <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
          {HEADLINE_TOKENS.map((token, index) => (
            <Fragment key={`${token.text}-${index}`}>
              <MaskRise
                inline
                delay={introDelay + 0.06 + index * 0.035}
                className="-mb-[0.22em] pb-[0.22em]"
              >
                {token.emphasis ? (
                  <em
                    className="italic text-primary"
                    style={{ textShadow: "0 0 18px rgb(var(--primary) / 0.35)" }}
                  >
                    {token.text}
                  </em>
                ) : (
                  token.text
                )}
              </MaskRise>{" "}
            </Fragment>
          ))}
        </h1>

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
        posters={heroPosters}
        introDelay={introDelay}
      />
    </div>
  );
}
