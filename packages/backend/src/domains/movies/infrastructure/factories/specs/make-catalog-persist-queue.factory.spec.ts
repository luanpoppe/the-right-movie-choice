import { describe, it, expect, vi, beforeEach } from "vitest";
import { MovieCatalogPersistConstants } from "@/domains/movies/domain/movie-catalog-persist.constants";

const { queueConstructorCalls, redisConstructorCalls } = vi.hoisted(() => ({
  queueConstructorCalls: [] as unknown[][],
  redisConstructorCalls: [] as unknown[][],
}));

vi.mock("bullmq", () => ({
  Queue: class Queue {
    constructor(...args: unknown[]) {
      queueConstructorCalls.push(args);
    }
  },
}));

vi.mock("ioredis", () => ({
  Redis: class Redis {
    constructor(...args: unknown[]) {
      redisConstructorCalls.push(args);
    }
  },
}));

vi.mock("@/env", () => ({
  env: {
    REDIS_URL: "redis://localhost:6379",
  },
}));

import { CatalogPersistBullmqConnection } from "../catalog-persist-bullmq.connection";
import { MakeCatalogPersistQueueFactory } from "../make-catalog-persist-queue.factory";

describe("MakeCatalogPersistQueueFactory", () => {
  beforeEach(() => {
    queueConstructorCalls.length = 0;
    redisConstructorCalls.length = 0;
  });

  it("getQueue singleton usa fila catalog-movie-persist e conexão compartilhada", () => {
    const firstQueue = MakeCatalogPersistQueueFactory.getQueue();
    const secondQueue = MakeCatalogPersistQueueFactory.getQueue();

    expect(firstQueue).toBe(secondQueue);
    expect(queueConstructorCalls).toHaveLength(1);
    expect(queueConstructorCalls[0]?.[0]).toBe(
      MovieCatalogPersistConstants.QUEUE_NAME,
    );
    expect(redisConstructorCalls).toHaveLength(1);
    const redisOptions = redisConstructorCalls[0]?.[1] as {
      maxRetriesPerRequest: null;
    };
    expect(redisOptions.maxRetriesPerRequest).toBe(null);
  });

  it("getQueue com connection explícita cria Queue dedicada", () => {
    const providedConnection = { id: "test-connection" } as never;
    queueConstructorCalls.length = 0;

    const queue = MakeCatalogPersistQueueFactory.getQueue(providedConnection);

    expect(queue).toBeDefined();
    expect(queueConstructorCalls).toHaveLength(1);
    expect(queueConstructorCalls[0]?.[1]).toEqual({
      connection: providedConnection,
    });
  });

  it("CatalogPersistBullmqConnection.get reutiliza mesma instância", () => {
    const firstConnection = CatalogPersistBullmqConnection.get();
    const secondConnection = CatalogPersistBullmqConnection.get();

    expect(firstConnection).toBe(secondConnection);
  });
});
