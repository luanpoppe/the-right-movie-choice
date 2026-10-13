import { Skeleton } from "@/components/ui/skeleton";

interface ChatSkeletonProps {
  label?: string;
}

export function ChatSkeleton({ label = "Loading..." }: ChatSkeletonProps) {
  return (
    <div
      className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-8 sm:px-6"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>

      <div className="mb-6 flex items-center justify-center border-b border-border pb-4">
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex-1 space-y-8">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-20 w-2/3 rounded-xl" />
        </div>

        <div className="flex items-start justify-end gap-3">
          <Skeleton className="h-14 w-1/2 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>

        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="w-full space-y-4">
            <Skeleton className="h-16 w-2/3 rounded-xl" />
            <div className="grid gap-5 md:grid-cols-3">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
