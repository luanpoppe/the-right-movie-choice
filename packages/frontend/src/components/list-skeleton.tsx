import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ListSkeletonProps {
  rows?: number;
  compact?: boolean;
  label?: string;
  className?: string;
}

export function ListSkeleton({
  rows = 4,
  compact = false,
  label = "Loading...",
  className,
}: ListSkeletonProps) {
  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            {!compact && <Skeleton className="h-3 w-56" />}
          </div>
          {!compact && <Skeleton className="h-9 w-24" />}
        </div>
      ))}
    </div>
  );
}
