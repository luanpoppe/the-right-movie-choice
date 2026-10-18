import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

interface MaskRiseProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function MaskRise({ children, delay = 0, className }: MaskRiseProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <span className={cn("block overflow-hidden", className)}>
      <motion.span
        className="block"
        initial={shouldReduceMotion ? false : { y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}
