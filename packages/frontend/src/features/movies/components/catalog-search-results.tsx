import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return (
    <div
      className="flex items-center justify-center gap-2 py-12 text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>Searching movies...</span>
    </div>
  );
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
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {results.map((hit) => (
          <SearchMovieCard key={hit.id} hit={hit} />
        ))}
      </div>

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
