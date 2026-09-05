import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { MovieCatalogFreshnessUtils } from "@/domains/movies/domain/movie-catalog-freshness.utils";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  IMovieCatalogRepository,
  MovieCatalogStoredRecord,
} from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { Logger } from "@/lib/logger/logger";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";

export class MovieCatalogDetailsResolver {
  constructor(
    private readonly cache: TmdbMovieDetailsCache,
    private readonly repository: IMovieCatalogRepository,
    private readonly catalog: IMovieCatalogProvider,
  ) {}

  async resolveByTmdbId(
    tmdbId: number,
    language?: string,
  ): Promise<MovieCatalogDetails> {
    const lang = language ?? DEFAULT_MOVIE_CATALOG_LANGUAGE;
    const now = new Date();

    const cachedDetails = await this.cache.get(tmdbId, lang);
    const hasCachedDetails = cachedDetails !== null;
    if (hasCachedDetails) return cachedDetails;

    const localRecord = await MovieCatalogDetailsResolver.findLocalRecordSafely(
      this.repository,
      tmdbId,
      lang,
    );
    const hasLocalRecord = localRecord !== null;

    if (hasLocalRecord)
      return this.resolveFromLocalRecord(tmdbId, lang, localRecord, now);

    return this.fetchFromTmdbAndCache(tmdbId, lang);
  }

  private async resolveFromLocalRecord(
    tmdbId: number,
    lang: string,
    localRecord: MovieCatalogStoredRecord,
    now: Date,
  ): Promise<MovieCatalogDetails> {
    const updatedAt = localRecord.updatedAt;
    const isFresh = MovieCatalogFreshnessUtils.isFresh(updatedAt, now);
    const localDetails = localRecord.details;

    if (isFresh) {
      await this.cache.set(tmdbId, localDetails, lang);
      return localDetails;
    }

    return this.resolveStaleLocalRecord(tmdbId, lang, localDetails);
  }

  private async resolveStaleLocalRecord(
    tmdbId: number,
    lang: string,
    staleDetails: MovieCatalogDetails,
  ): Promise<MovieCatalogDetails> {
    try {
      const tmdbDetails = await this.catalog.getMovieDetails(tmdbId, lang);
      await this.cache.set(tmdbId, tmdbDetails, lang);
      return tmdbDetails;
    } catch (error) {
      MovieCatalogDetailsResolver.logStaleFallback(tmdbId, error);
      return staleDetails;
    }
  }

  private async fetchFromTmdbAndCache(
    tmdbId: number,
    lang: string,
  ): Promise<MovieCatalogDetails> {
    const tmdbDetails = await this.catalog.getMovieDetails(tmdbId, lang);
    await this.cache.set(tmdbId, tmdbDetails, lang);
    return tmdbDetails;
  }

  private static async findLocalRecordSafely(
    repository: IMovieCatalogRepository,
    tmdbId: number,
    lang: string,
  ): Promise<MovieCatalogStoredRecord | null> {
    try {
      const record = await repository.findByTmdbId(tmdbId, lang);
      return record;
    } catch (error) {
      MovieCatalogDetailsResolver.logRepositorySkip(tmdbId, error);
      return null;
    }
  }

  private static logRepositorySkip(tmdbId: number, error: unknown): void {
    const reason = MovieCatalogDetailsResolver.errorMessage(error);
    Logger.warn("Movie catalog findByTmdbId failed, skipping to TMDB", {
      tmdbId,
      reason,
    });
  }

  private static logStaleFallback(tmdbId: number, error: unknown): void {
    const reason = MovieCatalogDetailsResolver.errorMessage(error);
    Logger.warn(
      "Movie catalog details TMDB refresh failed, returning stale local record",
      {
        tmdbId,
        reason,
      },
    );
  }

  private static errorMessage(error: unknown): string {
    const isErrorInstance = error instanceof Error;
    if (isErrorInstance) {
      return error.message;
    }

    return String(error);
  }
}
