import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import type { MovieSearchHit } from "../dto/movie-catalog-search.dto";
import { MovieCatalogSearchService } from "../services/movie-catalog-search.service";
import {
  CatalogSearchFiltersUtils,
  type CatalogSearchFilters,
  type CatalogSearchLanguage,
} from "../utils/catalog-search-filters.utils";
import {
  CatalogSearchFiltersValidationUtils,
  type CatalogSearchFiltersValidationError,
} from "../utils/catalog-search-filters-validation.utils";

class CatalogSearchHookUtils {
  static toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error(String(error));
  }
}

export interface UseCatalogSearchResult {
  results: MovieSearchHit[];
  loading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
  filters: CatalogSearchFilters;
  errors: CatalogSearchFiltersValidationError[];
  search: (text: string) => void;
  applyFilters: (filters: CatalogSearchFilters) => void;
  loadMore: () => void;
  setLanguage: (language: CatalogSearchLanguage) => void;
  retry: () => void;
}

export function useCatalogSearch(): UseCatalogSearchResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const [results, setResults] = useState<MovieSearchHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<CatalogSearchFilters>({});
  const [errors, setErrors] = useState<CatalogSearchFiltersValidationError[]>(
    [],
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const activeFetchIdRef = useRef(0);
  const appendNextPageRef = useRef(false);

  const runFetch = useCallback(
    async (requestFilters: CatalogSearchFilters, append: boolean) => {
      const fetchId = activeFetchIdRef.current + 1;
      activeFetchIdRef.current = fetchId;

      setLoading(true);
      setError(null);

      const requestPage = requestFilters.page ?? 1;
      const requestLanguage = requestFilters.language;
      const mode = CatalogSearchFiltersUtils.resolveMode(requestFilters);

      try {
        const response =
          mode === "discover"
            ? await MovieCatalogSearchService.discoverMovies(
                requestFilters,
                requestPage,
                requestLanguage,
              )
            : await MovieCatalogSearchService.searchMovies({
                query: requestFilters.query,
                page: requestPage,
                language: requestLanguage,
              });

        const isStaleFetch = fetchId !== activeFetchIdRef.current;
        if (isStaleFetch) {
          return;
        }

        const hasResponseResults = response.results.length > 0;
        setResults((currentResults) =>
          append ? [...currentResults, ...response.results] : response.results,
        );
        setHasMore(hasResponseResults);
      } catch (fetchError) {
        const isStaleFetch = fetchId !== activeFetchIdRef.current;
        if (isStaleFetch) {
          return;
        }

        setError(CatalogSearchHookUtils.toError(fetchError));
      } finally {
        const isCurrentFetch = fetchId === activeFetchIdRef.current;
        if (isCurrentFetch) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const parsedFilters = CatalogSearchFiltersUtils.parse(searchParams);
    const validation =
      CatalogSearchFiltersValidationUtils.validate(parsedFilters);
    setErrors(validation.errors);

    if (!validation.valid) {
      setFilters(parsedFilters);
      setHasMore(false);
      setLoading(false);
      return;
    }

    const normalizedFilters = validation.normalized;
    setFilters(normalizedFilters);

    const shouldAppend = appendNextPageRef.current;
    appendNextPageRef.current = false;

    void runFetch(normalizedFilters, shouldAppend);
  }, [searchParams, refreshKey, runFetch]);

  const navigateToFilters = useCallback(
    (nextFilters: CatalogSearchFilters) => {
      const nextParams = CatalogSearchFiltersUtils.serialize(nextFilters);
      setSearchParams(nextParams);
    },
    [setSearchParams],
  );

  const search = useCallback(
    (text: string) => {
      const currentFilters = CatalogSearchFiltersUtils.parse(searchParams);
      const trimmedText = text.trim();
      const hasQuery = trimmedText.length > 0;

      const nextFilters: CatalogSearchFilters = {
        language: currentFilters.language,
      };
      if (hasQuery) {
        nextFilters.query = trimmedText;
      }

      navigateToFilters(nextFilters);
    },
    [searchParams, navigateToFilters],
  );

  const applyFilters = useCallback(
    (nextFilters: CatalogSearchFilters) => {
      const currentFilters = CatalogSearchFiltersUtils.parse(searchParams);
      const language = nextFilters.language ?? currentFilters.language;
      const hasDiscoverFilters =
        CatalogSearchFiltersUtils.hasDiscoverFilters(nextFilters);

      const mergedFilters: CatalogSearchFilters = {
        ...nextFilters,
        language,
        page: undefined,
      };
      if (hasDiscoverFilters) {
        mergedFilters.query = undefined;
      }

      navigateToFilters(mergedFilters);
    },
    [searchParams, navigateToFilters],
  );

  const loadMore = useCallback(() => {
    const currentFilters = CatalogSearchFiltersUtils.parse(searchParams);
    const currentPage = currentFilters.page ?? 1;

    const nextFilters: CatalogSearchFilters = {
      ...currentFilters,
      page: currentPage + 1,
    };

    appendNextPageRef.current = true;
    navigateToFilters(nextFilters);
  }, [searchParams, navigateToFilters]);

  const setLanguage = useCallback(
    (language: CatalogSearchLanguage) => {
      const currentFilters = CatalogSearchFiltersUtils.parse(searchParams);
      const nextFilters: CatalogSearchFilters = {
        ...currentFilters,
        language,
        page: undefined,
      };

      navigateToFilters(nextFilters);
    },
    [searchParams, navigateToFilters],
  );

  const retry = useCallback(() => {
    setRefreshKey((currentKey) => currentKey + 1);
  }, []);

  const page = filters.page ?? 1;

  return {
    results,
    loading,
    error,
    page,
    hasMore,
    filters,
    errors,
    search,
    applyFilters,
    loadMore,
    setLanguage,
    retry,
  };
}
