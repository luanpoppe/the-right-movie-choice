import { Worker, type WorkerOptions } from "bullmq";
import { Redis as IORedis } from "ioredis";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { MovieCatalogPersistConstants } from "@/domains/movies/domain/movie-catalog-persist.constants";
import { CatalogPersistProcessor } from "../workers/catalog-persist.processor";

import { CatalogPersistBullmqConnection } from "./catalog-persist-bullmq.connection";

export type MakeCatalogPersistWorkerFactoryParams = {
  repository: IMovieCatalogRepository;
  connection?: IORedis;
};

export class MakeCatalogPersistWorkerFactory {
  static create(params: MakeCatalogPersistWorkerFactoryParams): Worker {
    const repository = params.repository;
    const providedConnection = params.connection;
    const connection = CatalogPersistBullmqConnection.get(providedConnection);

    const processor = new CatalogPersistProcessor(repository);
    const workerOptions =
      MakeCatalogPersistWorkerFactory.buildWorkerOptions(connection);

    const worker = new Worker(
      MovieCatalogPersistConstants.QUEUE_NAME,
      async (job) => {
        const jobData = job.data;
        await processor.process(jobData);
      },
      workerOptions,
    );
    return worker;
  }

  static defaultJobOptions() {
    const attempts = MovieCatalogPersistConstants.MAX_ATTEMPTS;
    const jobOptions = {
      attempts,
      backoff: {
        type: "custom" as const,
      },
    };
    return jobOptions;
  }

  static backoffDelayMs(attemptsMade: number): number {
    const delayIndex = attemptsMade - 1;
    const delays = MovieCatalogPersistConstants.BACKOFF_DELAYS_MS;
    const delay = delays[delayIndex];
    if (delay !== undefined) {
      return delay;
    }

    const lastIndex = delays.length - 1;
    const lastDelay = delays[lastIndex];
    if (lastDelay !== undefined) {
      return lastDelay;
    }

    return 0;
  }

  private static buildWorkerOptions(connection: IORedis): WorkerOptions {
    const concurrency = MovieCatalogPersistConstants.CONCURRENCY;
    const removeOnFailCount = MovieCatalogPersistConstants.REMOVE_ON_FAIL_COUNT;
    const removeOnCompleteCount =
      MovieCatalogPersistConstants.REMOVE_ON_COMPLETE_COUNT;

    const workerOptions: WorkerOptions = {
      connection,
      concurrency,
      removeOnComplete: { count: removeOnCompleteCount },
      removeOnFail: { count: removeOnFailCount },
      settings: {
        backoffStrategy: MakeCatalogPersistWorkerFactory.backoffDelayMs,
      },
    };
    return workerOptions;
  }
}
