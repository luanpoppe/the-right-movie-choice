import { Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { MovieCatalogPersistConstants } from "@/domains/movies/domain/movie-catalog-persist.constants";

import { CatalogPersistBullmqConnection } from "./catalog-persist-bullmq.connection";

export class MakeCatalogPersistQueueFactory {
  private static queue: Queue | null = null;

  static getQueue(providedConnection?: IORedis): Queue {
    if (providedConnection !== undefined) {
      const queueName = MovieCatalogPersistConstants.QUEUE_NAME;
      const queue = new Queue(queueName, { connection: providedConnection });
      return queue;
    }

    const existingQueue = MakeCatalogPersistQueueFactory.queue;
    if (existingQueue !== null) {
      return existingQueue;
    }

    const connection = CatalogPersistBullmqConnection.get();
    const queueName = MovieCatalogPersistConstants.QUEUE_NAME;
    const queue = new Queue(queueName, { connection });
    MakeCatalogPersistQueueFactory.queue = queue;
    return queue;
  }
}
