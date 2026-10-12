import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieGridSkeleton } from "@/components/movie-grid-skeleton";
import { SearchMovieCard } from "@/components/search-movie-card";
import type { MovieSearchHit } from "@/features/movies/dto/movie-catalog-search.dto";

interface CatalogSearchResultsProps {
  results: MovieSearchHit[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  emptyMessage?: string;
}

const DEFAULT_EMPTY_MESSAGE = "No movies found. Try another search.";

function CatalogSearchResultsLoading() {
  return <MovieGridSkeleton count={4} label="Searching movies..." />;
}

function CatalogSearchResultsError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="text-muted-foreground">
        Could not load results. The catalog may be unavailable.
      </p>
      <Button type="button" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function CatalogSearchResultsInlineError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
    >
      <p className="text-sm text-destructive">
        Could not load more results. The catalog may be unavailable.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function LoadMoreOnScroll({
  onLoadMore,
  disabled,
}: {
  onLoadMore: () => void;
  disabled: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
          onLoadMore();
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, disabled]);

  return <div ref={sentinelRef} aria-hidden className="h-px w-full" />;
}

export function CatalogSearchResults({
  results,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
}: CatalogSearchResultsProps) {
  const hasError = error !== null;
  const hasResults = results.length > 0;
  const isInitialLoading = loading && !hasResults;
  const isLoadMoreDisabled = loading || hasError;

  if (isInitialLoading) {
    return <CatalogSearchResultsLoading />;
  }

  if (hasError && !hasResults) {
    return <CatalogSearchResultsError onRetry={onRetry} />;
  }

  if (!hasResults) {
    return (
      <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-6">
      {hasError && <CatalogSearchResultsInlineError onRetry={onRetry} />}

      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {results.map((hit) => (
          <SearchMovieCard key={hit.id} hit={hit} />
        ))}
      </div>

      {hasMore && (
        <LoadMoreOnScroll
          onLoadMore={onLoadMore}
          disabled={isLoadMoreDisabled}
        />
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
