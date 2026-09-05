import { Redis as IORedis } from "ioredis";
import { env } from "@/env";

export class CatalogPersistBullmqConnection {
  private static connection: IORedis | null = null;

  static get(provided?: IORedis): IORedis {
    if (provided !== undefined) {
      return provided;
    }

    const existingConnection = CatalogPersistBullmqConnection.connection;
    if (existingConnection !== null) {
      return existingConnection;
    }

    const redisUrl = env.REDIS_URL;
    const connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    CatalogPersistBullmqConnection.connection = connection;
    return connection;
  }
}
