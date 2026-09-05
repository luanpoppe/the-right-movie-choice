import type { Worker } from "bullmq";
import { MovieCatalogPersistConstants } from "@/domains/movies/domain/movie-catalog-persist.constants";
import { MakeCatalogPersistWorkerFactory } from "@/domains/movies/infrastructure/factories/make-catalog-persist-worker.factory";
import { PrismaMovieCatalogRepository } from "@/domains/movies/infrastructure/repositories/movie-catalog/prisma-movie-catalog.repository";
import { Logger } from "@/lib/logger/logger";
import { ErrorUtils } from "@/shared/utils/error.utils";

export class CatalogPersistWorkerStarter {
  static start(): Worker | null {
    try {
      const repository = new PrismaMovieCatalogRepository();
      const worker = MakeCatalogPersistWorkerFactory.create({ repository });
      const queueName = MovieCatalogPersistConstants.QUEUE_NAME;
      const concurrency = MovieCatalogPersistConstants.CONCURRENCY;

      Logger.info("Catalog persist worker started", {
        queueName,
        concurrency,
      });
      return worker;
    } catch (error) {
      const reason = ErrorUtils.message(error);
      Logger.warn(
        "Catalog persist worker failed to start, HTTP will continue without job processing",
        { reason },
      );
      return null;
    }
  }
}
