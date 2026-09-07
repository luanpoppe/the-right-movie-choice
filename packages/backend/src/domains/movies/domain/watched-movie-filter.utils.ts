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
      const shouldKeepResult = WatchedMovieFilterUtils.shouldKeepResult(
        result,
        watchedTmdbIds,
      );

      if (!shouldKeepResult) {
        continue;
      }

      filteredResults.push(result);
    }

    return filteredResults;
  }

  private static shouldKeepResult(
    result: MovieCatalogLookupResult,
    watchedTmdbIds: ReadonlySet<number>,
  ): boolean {
    if (!result.found) {
      return true;
    }

    const tmdbId = result.details.tmdbId;
    const isWatched = watchedTmdbIds.has(tmdbId);
    if (isWatched) {
      return false;
    }

    return true;
  }
}
