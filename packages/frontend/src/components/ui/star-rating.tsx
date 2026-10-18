import { useId, useState } from "react";
import { Star } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const MAGNET_RADIUS = 3;
const MAGNET_LIFT_PX = 5;
const MAGNET_SCALE_STEP = 0.22;

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

function getMagnetIntensity(
  score: number,
  hoveredScore: number | null,
): number {
  if (hoveredScore === null) {
    return 0;
  }

  const distance = Math.abs(score - hoveredScore);
  if (distance >= MAGNET_RADIUS) {
    return 0;
  }

  return 1 - distance / MAGNET_RADIUS;
}

export function StarRating({
  value,
  onChange,
  max = 10,
  label = "Rating",
  disabled = false,
  className,
}: StarRatingProps) {
  const groupName = useId();
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [popWave, setPopWave] = useState(0);
  const shouldReduceMotion = useReducedMotion() ?? false;

  const shownScore = hoveredScore ?? value;

  function handlePick(score: number) {
    if (disabled) {
      return;
    }

    setPopWave((wave) => wave + 1);
    onChange(score);
  }

  return (
    <fieldset
      onPointerLeave={() => setHoveredScore(null)}
      disabled={disabled}
      className={cn(
        "m-0 inline-flex min-w-0 items-center border-0 p-0",
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {Array.from({ length: max }, (_, index) => index + 1).map((score) => {
        const isLit = score <= shownScore;
        const isSelected = score <= value;
        const isMagnetActive = !disabled && !shouldReduceMotion;
        const intensity = isMagnetActive
          ? getMagnetIntensity(score, hoveredScore)
          : 0;
        const magnetStyle = {
          transform: `translateY(${(-MAGNET_LIFT_PX * intensity).toFixed(2)}px) scale(${(1 + MAGNET_SCALE_STEP * intensity).toFixed(3)})`,
        };

        return (
          <label
            key={score}
            onPointerEnter={() => !disabled && setHoveredScore(score)}
            className={cn(
              "grid touch-manipulation place-items-center rounded-sm px-[3px] py-1.5 sm:px-0.5 sm:py-0.5",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={score}
              checked={score === value}
              onChange={() => handlePick(score)}
              disabled={disabled}
              className="peer sr-only"
            />
            <span className="sr-only">
              {score} of {max} stars
            </span>
            <span
              aria-hidden="true"
              style={magnetStyle}
              className="grid origin-bottom rounded-sm transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              <Star
                key={isSelected ? popWave : 0}
                style={{ animationDelay: `${(score - 1) * 18}ms` }}
                className={cn(
                  "h-5 w-5 transition-colors",
                  isLit
                    ? "fill-primary text-primary"
                    : "fill-transparent text-muted-foreground/40",
                  popWave > 0 &&
                    isSelected &&
                    "animate-[star-pop_320ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none",
                )}
              />
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
