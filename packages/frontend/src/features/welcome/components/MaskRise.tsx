import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

interface MaskRiseProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  inline?: boolean;
}

export function MaskRise({
  children,
  delay = 0,
  className,
  inline = false,
}: MaskRiseProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const displayClass = inline ? "inline-block" : "block";

  return (
    <span className={cn(displayClass, "overflow-hidden", className)}>
      <motion.span
        className={displayClass}
        initial={shouldReduceMotion ? false : { y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}
