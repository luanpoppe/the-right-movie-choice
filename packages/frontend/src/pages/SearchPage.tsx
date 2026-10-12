import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogSearchBar } from "@/features/movies/components/catalog-search-bar";
import { CatalogSearchFiltersPanel } from "@/features/movies/components/catalog-search-filters-panel";
import { CatalogSearchResults } from "@/features/movies/components/catalog-search-results";
import { UserMovieEntriesProvider } from "@/features/movies/context/user-movie-entries.context";
import { useCatalogSearch } from "@/features/movies/hooks/use-catalog-search";
import type { CatalogSearchLanguage } from "@/features/movies/utils/catalog-search-filters.utils";
import { StringUtils } from "@/utils/string.utils";

const DEFAULT_LANGUAGE: CatalogSearchLanguage = "en-US";

function SearchPageContent() {
  const {
    results,
    loading,
    error,
    hasMore,
    filters,
    errors,
    search,
    applyFilters,
    loadMore,
    setLanguage,
    retry,
  } = useCatalogSearch();

  const language = filters.language ?? DEFAULT_LANGUAGE;
  const validationMessages = errors.map(
    (validationError) => validationError.message,
  );
  const hasValidationErrors = validationMessages.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-6">
      <PageHeader
        title="Search movies"
        description="Find a movie by title or discover by filters, then save it to your lists."
      />

      <div className="mb-6 space-y-4">
        <CatalogSearchBar
          value={filters.query ?? ""}
          onSearch={search}
          language={language}
          onLanguageChange={setLanguage}
        />

        {hasValidationErrors && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <ul className="list-disc space-y-1 pl-5">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <CatalogSearchFiltersPanel
          filters={filters}
          onApply={applyFilters}
          language={language}
        />
      </div>

      <CatalogSearchResults
        results={results}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRetry={retry}
      />
    </div>
  );
}

export function SearchPage() {
  const { accessToken } = useAuth();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  if (!hasAccessToken) {
    return <SearchPageContent />;
  }

  return (
    <UserMovieEntriesProvider>
      <SearchPageContent />
    </UserMovieEntriesProvider>
  );
}
