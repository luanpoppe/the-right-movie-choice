import type { MovieCatalogLookupResult } from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";

export class WatchedMovieFilterUtils {
  static filterLookupResults(
    results: MovieCatalogLookupResult[],
    watchedTmdbIds: ReadonlySet<number>,
  ): MovieCatalogLookupResult[] {
    if (watchedTmdbIds.size === 0) {
      return results;
    }

    const filteredResults: MovieCatalogLookupResult[] = [];

    for (const result of results) {
      const filteredResult = WatchedMovieFilterUtils.filterResult(
        result,
        watchedTmdbIds,
      );
      filteredResults.push(filteredResult);
    }

    return filteredResults;
  }

  private static filterResult(
    result: MovieCatalogLookupResult,
    watchedTmdbIds: ReadonlySet<number>,
  ): MovieCatalogLookupResult {
    if (!result.found) {
      return result;
    }

    const tmdbId = result.details.tmdbId;
    const isWatched = watchedTmdbIds.has(tmdbId);
    if (!isWatched) {
      return result;
    }

    return {
      found: false,
      message: "Filme já assistido pelo usuário.",
    };
  }
}
