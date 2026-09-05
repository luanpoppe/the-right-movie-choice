import { Logger } from "@/lib/logger/logger";
import { StringUtils } from "@/shared/utils/string.utils";
import type {
  Movie,
  MovieCast,
  MovieDirector,
  MovieGenre,
  MovieOriginCountry,
  MovieWatchProvider as PrismaMovieWatchProvider,
} from "../../../../../../generated/prisma/client.js";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  type MovieCatalogStoredRecord,
  type MovieCatalogTitleYearLookupInput,
} from "../../../domain/repositories/movie-catalog.repository";
import { MovieCatalogPrismaMapper } from "../../mappers/movie-catalog-prisma.mapper";
import {
  MovieCatalogTitleSearchSql,
  type MovieCatalogTitleSearchBatchItem,
} from "./title-search-sql";

type MovieCatalogRowWithChildren = Movie & {
  genres: MovieGenre[];
  directors: MovieDirector[];
  cast: MovieCast[];
  originCountries: MovieOriginCountry[];
  watchProviders: PrismaMovieWatchProvider[];
};

export class MovieCatalogBatchTitleLookup {
  static createEmptyResults(
    inputCount: number,
  ): Array<MovieCatalogStoredRecord | null> {
    const results: Array<MovieCatalogStoredRecord | null> = new Array(
      inputCount,
    ).fill(null);
    return results;
  }

  static buildSearchableItems(
    inputs: MovieCatalogTitleYearLookupInput[],
  ): MovieCatalogTitleSearchBatchItem[] {
    const searchableItems: MovieCatalogTitleSearchBatchItem[] = [];
    const inputCount = inputs.length;

    for (let index = 0; index < inputCount; index++) {
      const input = inputs[index];
      if (input === undefined) {
        continue;
      }

      const title = input.title;
      const isTitleEmpty = StringUtils.isEmptyString(title);
      if (isTitleEmpty) {
        continue;
      }

      const catalogLanguage = input.language ?? DEFAULT_MOVIE_CATALOG_LANGUAGE;
      const likePattern = MovieCatalogTitleSearchSql.buildLikePattern(title);
      const searchableItem: MovieCatalogTitleSearchBatchItem = {
        index,
        catalogLanguage,
        likePattern,
      };
      if (input.year !== undefined) {
        searchableItem.year = input.year;
      }
      searchableItems.push(searchableItem);
    }

    return searchableItems;
  }

  static collectUniqueMovieIds(
    idRows: Array<{ id: number }>,
  ): number[] {
    const uniqueIds: number[] = [];
    const seenIds = new Set<number>();

    for (const idRow of idRows) {
      const movieId = idRow.id;
      const isNewId = !seenIds.has(movieId);
      if (isNewId) {
        seenIds.add(movieId);
        uniqueIds.push(movieId);
      }
    }

    return uniqueIds;
  }

  static logMiss(
    input: MovieCatalogTitleYearLookupInput,
    catalogLanguage: string,
  ): void {
    Logger.debug("Movie catalog find by titles and years miss", {
      title: input.title,
      year: input.year,
      language: catalogLanguage,
    });
  }

  static logMissesForSearchableItems(
    inputs: MovieCatalogTitleYearLookupInput[],
    searchableItems: MovieCatalogTitleSearchBatchItem[],
  ): void {
    for (const item of searchableItems) {
      const input = inputs[item.index];
      if (input === undefined) {
        continue;
      }
      MovieCatalogBatchTitleLookup.logMiss(input, item.catalogLanguage);
    }
  }

  static applyIdRowsToResults(
    inputs: MovieCatalogTitleYearLookupInput[],
    idRows: Array<{ idx: number; id: number }>,
    rowById: Map<number, MovieCatalogRowWithChildren>,
    results: Array<MovieCatalogStoredRecord | null>,
  ): Set<number> {
    const matchedIndices = new Set<number>();

    for (const idRow of idRows) {
      const idx = idRow.idx;
      const row = rowById.get(idRow.id);
      const input = inputs[idx];
      if (input === undefined) {
        continue;
      }

      const catalogLanguage =
        input.language ?? DEFAULT_MOVIE_CATALOG_LANGUAGE;

      if (!row) {
        MovieCatalogBatchTitleLookup.logMiss(input, catalogLanguage);
        continue;
      }

      matchedIndices.add(idx);
      Logger.debug("Movie catalog find by titles and years hit", {
        tmdbId: row.tmdbId,
        language: catalogLanguage,
      });

      const details = MovieCatalogPrismaMapper.toDetails(row);
      const storedRecord: MovieCatalogStoredRecord = {
        details,
        updatedAt: row.updatedAt,
      };
      results[idx] = storedRecord;
    }

    return matchedIndices;
  }

  static logUnmatchedSearchableItems(
    inputs: MovieCatalogTitleYearLookupInput[],
    searchableItems: MovieCatalogTitleSearchBatchItem[],
    matchedIndices: Set<number>,
  ): void {
    for (const item of searchableItems) {
      const wasMatched = matchedIndices.has(item.index);
      if (wasMatched) {
        continue;
      }

      const input = inputs[item.index];
      if (input === undefined) {
        continue;
      }

      MovieCatalogBatchTitleLookup.logMiss(input, item.catalogLanguage);
    }
  }
}
