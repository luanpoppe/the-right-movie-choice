import { Skeleton } from "@/components/ui/skeleton";

interface MovieGridSkeletonProps {
  count?: number;
  label?: string;
}

export function MovieGridSkeleton({
  count = 4,
  label = "Loading...",
}: MovieGridSkeletonProps) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <Skeleton className="aspect-[2/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
