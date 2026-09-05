import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieCatalogPersistJobData } from "@/domains/movies/domain/entities/movie-catalog-persist-job.entity";
import { MovieCatalogImdbConflictException } from "@/domains/movies/domain/exceptions/movie-catalog-imdb-conflict.exception";
import { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { Logger } from "@/lib/logger/logger";
import { ErrorUtils } from "@/shared/utils/error.utils";
import { StringUtils } from "@/shared/utils/string.utils";

export class CatalogPersistProcessor {
  constructor(private readonly repository: IMovieCatalogRepository) {}

  async process(data: unknown): Promise<void> {
    const startedAt = Date.now();
    const validatedPayload = CatalogPersistProcessor.validatePayload(data);

    if (validatedPayload === null) {
      Logger.warn("Invalid catalog persist job payload");
      return;
    }

    const details = validatedPayload.details;
    const language = validatedPayload.language;
    const tmdbId = details.tmdbId;

    try {
      await this.repository.upsert(details, language);
      const durationMs = Date.now() - startedAt;
      Logger.info("Catalog persist job completed", {
        durationMs,
        success: true,
        tmdbId,
      });
    } catch (error) {
      const isImdbConflict = error instanceof MovieCatalogImdbConflictException;
      if (isImdbConflict) {
        const imdbId = details.imdbId ?? "unknown";
        Logger.warn("Movie catalog IMDb conflict during persist", {
          imdbId,
          language,
        });
        return;
      }

      const durationMs = Date.now() - startedAt;
      const reason = ErrorUtils.message(error);
      Logger.error("Catalog persist job failed", {
        durationMs,
        success: false,
        tmdbId,
        reason,
      });
      throw error;
    }
  }

  private static validatePayload(
    data: unknown,
  ): MovieCatalogPersistJobData | null {
    const isObject = typeof data === "object" && data !== null;
    if (!isObject) return null;

    const payload = data as Record<string, unknown>;
    const language = payload.language;
    const isLanguageString = typeof language === "string";
    if (!isLanguageString) return null;

    const isLanguageEmpty = StringUtils.isEmptyString(language);
    if (isLanguageEmpty) return null;

    const details = payload.details;
    const isDetailsObject = typeof details === "object" && details !== null;
    if (!isDetailsObject) return null;

    const detailsRecord = details as Record<string, unknown>;
    const tmdbId = detailsRecord.tmdbId;
    const isTmdbIdNumber = typeof tmdbId === "number";
    if (!isTmdbIdNumber) return null;

    const isTmdbIdFinite = Number.isFinite(tmdbId);
    if (!isTmdbIdFinite) return null;

    const validatedDetails = details as MovieCatalogDetails;
    const validatedPayload: MovieCatalogPersistJobData = {
      language,
      details: validatedDetails,
    };
    return validatedPayload;
  }
}
