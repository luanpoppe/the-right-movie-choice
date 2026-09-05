import type {
  MovieCatalogLookupInput,
  MovieCatalogLookupResult,
} from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { MovieCatalogFreshnessUtils } from "@/domains/movies/domain/movie-catalog-freshness.utils";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  MovieCatalogStoredRecord,
  MovieCatalogTitleYearLookupInput,
} from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { StringUtils } from "@/shared/utils/string.utils";

export type MovieCatalogBatchCacheWarmItem = {
  movieId: number;
  details: MovieCatalogDetails;
  lang?: string;
};

export type MovieCatalogBatchPrepareResult = {
  results: Array<MovieCatalogLookupResult | null>;
  indicesPendingLocalLookup: number[];
  batchInputs: MovieCatalogTitleYearLookupInput[];
};

export type MovieCatalogBatchLocalLookupOutcome = {
  cacheWarmItems: MovieCatalogBatchCacheWarmItem[];
  indicesNeedingTmdbLookup: number[];
};

export class MovieCatalogBatchLookup {
  static readonly EMPTY_QUERY_MESSAGE =
    "Informe o nome de um filme para buscar no catálogo.";

  static prepareBatchLookup(
    inputs: MovieCatalogLookupInput[],
  ): MovieCatalogBatchPrepareResult {
    const results: Array<MovieCatalogLookupResult | null> = [];
    const indicesPendingLocalLookup: number[] = [];
    const batchInputs: MovieCatalogTitleYearLookupInput[] = [];
    const inputCount = inputs.length;

    for (let index = 0; index < inputCount; index++) {
      const input = inputs[index];
      if (input === undefined) {
        continue;
      }

      const isQueryEmpty = StringUtils.isEmptyString(input.query);
      if (isQueryEmpty) {
        const missResult = MovieCatalogBatchLookup.createMiss(
          MovieCatalogBatchLookup.EMPTY_QUERY_MESSAGE,
        );
        results[index] = missResult;
        continue;
      }

      results[index] = null;
      indicesPendingLocalLookup.push(index);

      const language = MovieCatalogBatchLookup.resolveLanguage(input.language);
      const batchInput: MovieCatalogTitleYearLookupInput = {
        title: input.query,
        language,
      };
      const year = input.year;
      const hasYear = year !== undefined;
      if (hasYear) {
        batchInput.year = year;
      }
      batchInputs.push(batchInput);
    }

    return {
      results,
      indicesPendingLocalLookup,
      batchInputs,
    };
  }

  static applyLocalFreshHits(
    inputs: MovieCatalogLookupInput[],
    indicesPendingLocalLookup: number[],
    localRecords: Array<MovieCatalogStoredRecord | null>,
    results: Array<MovieCatalogLookupResult | null>,
    now: Date,
  ): MovieCatalogBatchLocalLookupOutcome {
    const cacheWarmItems: MovieCatalogBatchCacheWarmItem[] = [];
    const indicesNeedingTmdbLookup: number[] = [];

    for (let batchIndex = 0; batchIndex < localRecords.length; batchIndex++) {
      const inputIndex = indicesPendingLocalLookup[batchIndex];
      if (inputIndex === undefined) continue;

      const input = inputs[inputIndex];
      if (input === undefined) continue;

      const localRecord = localRecords[batchIndex];
      if (localRecord === undefined) {
        indicesNeedingTmdbLookup.push(inputIndex);
        continue;
      }

      const hasLocalRecord = localRecord !== null;
      if (!hasLocalRecord) {
        indicesNeedingTmdbLookup.push(inputIndex);
        continue;
      }

      const updatedAt = localRecord.updatedAt;
      const isFresh = MovieCatalogFreshnessUtils.isFresh(updatedAt, now);
      if (!isFresh) {
        indicesNeedingTmdbLookup.push(inputIndex);
        continue;
      }

      const language = MovieCatalogBatchLookup.resolveLanguage(input.language);
      const details = localRecord.details;
      const tmdbId = details.tmdbId;
      const cacheWarmItem: MovieCatalogBatchCacheWarmItem = {
        movieId: tmdbId,
        details,
        lang: language,
      };
      cacheWarmItems.push(cacheWarmItem);

      const hitResult: MovieCatalogLookupResult = {
        found: true,
        details,
      };
      results[inputIndex] = hitResult;
    }

    const localLookupOutcome: MovieCatalogBatchLocalLookupOutcome = {
      cacheWarmItems,
      indicesNeedingTmdbLookup,
    };
    return localLookupOutcome;
  }

  static createMiss(message: string): MovieCatalogLookupResult {
    const missResult: MovieCatalogLookupResult = {
      found: false,
      message,
    };
    return missResult;
  }

  static resolveLanguage(language?: string): string {
    const isLanguageEmpty = StringUtils.isEmptyString(language);
    if (isLanguageEmpty) {
      return DEFAULT_MOVIE_CATALOG_LANGUAGE;
    }

    return language;
  }
}
