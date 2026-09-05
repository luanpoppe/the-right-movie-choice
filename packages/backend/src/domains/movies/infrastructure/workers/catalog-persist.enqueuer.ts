import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieCatalogPersistJobData } from "@/domains/movies/domain/entities/movie-catalog-persist-job.entity";
import { MovieCatalogPersistConstants } from "@/domains/movies/domain/movie-catalog-persist.constants";
import { MakeCatalogPersistQueueFactory } from "@/domains/movies/infrastructure/factories/make-catalog-persist-queue.factory";
import { MakeCatalogPersistWorkerFactory } from "@/domains/movies/infrastructure/factories/make-catalog-persist-worker.factory";
import { Logger } from "@/lib/logger/logger";
import { ErrorUtils } from "@/shared/utils/error.utils";
import { StringUtils } from "@/shared/utils/string.utils";

export class CatalogPersistEnqueuer {
  private static readonly JOB_NAME = "persist";

  static async enqueue(
    details: MovieCatalogDetails,
    language: string,
  ): Promise<void> {
    const tmdbId = details.tmdbId;
    const isTmdbIdNumber = typeof tmdbId === "number";
    const isTmdbIdFinite = isTmdbIdNumber && Number.isFinite(tmdbId);
    const isLanguageEmpty = StringUtils.isEmptyString(language);
    const isInvalidInput = !isTmdbIdFinite || isLanguageEmpty;

    if (isInvalidInput) {
      Logger.warn(
        "Skipping catalog persist enqueue: invalid tmdbId or language",
        {
          language: language ?? "",
        },
      );
      return;
    }

    const queue = MakeCatalogPersistQueueFactory.getQueue();
    const jobId = MovieCatalogPersistConstants.jobId(tmdbId, language);

    const payload: MovieCatalogPersistJobData = {
      language,
      details,
    };
    const defaultJobOptions =
      MakeCatalogPersistWorkerFactory.defaultJobOptions();

    const addOptions = {
      jobId,
      ...defaultJobOptions,
    };

    try {
      await queue.add(CatalogPersistEnqueuer.JOB_NAME, payload, addOptions);
      Logger.info("Catalog persist job enqueued", {
        tmdbId,
        language,
        jobId,
      });
    } catch (error) {
      const reason = ErrorUtils.message(error);
      Logger.warn("Failed to enqueue catalog persist job", {
        tmdbId,
        language,
        reason,
      });
    }
  }
}
