import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MovieRatingUtils } from "@/features/movies/utils/movie-rating.utils";

interface MovieRatingBadgeProps {
  value: number | null | undefined;
  className?: string;
}

export function MovieRatingBadge({ value, className }: MovieRatingBadgeProps) {
  const label = MovieRatingUtils.format(value);
  if (label === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 text-xs font-medium text-primary backdrop-blur",
        className,
      )}
    >
      <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />
      {label}
    </span>
  );
}
