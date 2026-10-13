import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

const GLOW_SIZE = 640;

export function CursorGlow() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-GLOW_SIZE);
  const y = useMotionValue(-GLOW_SIZE);
  const springX = useSpring(x, { stiffness: 90, damping: 22, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 90, damping: 22, mass: 0.5 });

  useEffect(() => {
    if (reduce) {
      return;
    }

    const canHover = window.matchMedia("(hover: hover)").matches;
    if (!canHover) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const half = GLOW_SIZE / 2;
      x.set(event.clientX - half);
      y.set(event.clientY - half);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [reduce, x, y]);

  if (reduce) {
    return null;
  }

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 hidden rounded-full md:block"
      style={{
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        x: springX,
        y: springY,
        background:
          "radial-gradient(circle, rgb(var(--primary) / 0.12), transparent 62%)",
      }}
    />
  );
}
