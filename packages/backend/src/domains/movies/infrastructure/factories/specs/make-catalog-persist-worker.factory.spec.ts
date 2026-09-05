import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MovieCatalogPersistConstants } from "@/domains/movies/domain/movie-catalog-persist.constants";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";

const { workerConstructorCalls, processorProcessMock } = vi.hoisted(() => ({
  workerConstructorCalls: [] as unknown[][],
  processorProcessMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bullmq", () => ({
  Worker: class Worker {
    constructor(...args: unknown[]) {
      workerConstructorCalls.push(args);
    }
  },
}));

vi.mock("../../workers/catalog-persist.processor", () => ({
  CatalogPersistProcessor: class CatalogPersistProcessor {
    constructor(_repository: IMovieCatalogRepository) {}

    process = processorProcessMock;
  },
}));

vi.mock("@/env", () => ({
  env: {
    REDIS_URL: "redis://localhost:6379",
  },
}));

import { MakeCatalogPersistWorkerFactory } from "../make-catalog-persist-worker.factory";

describe("MakeCatalogPersistWorkerFactory", () => {
  let repository: IMovieCatalogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    workerConstructorCalls.length = 0;
    repository = {
      upsert: vi.fn(),
      findByTmdbId: vi.fn(),
      findByTitleAndYear: vi.fn(),
    };
  });

  it("cria Worker na fila catalog-movie-persist com concurrency 3", () => {
    const connection = { maxRetriesPerRequest: null } as never;

    MakeCatalogPersistWorkerFactory.create({ repository, connection });

    const queueName = workerConstructorCalls[0]?.[0];
    const options = workerConstructorCalls[0]?.[2] as Record<string, unknown>;
    expect(queueName).toBe(MovieCatalogPersistConstants.QUEUE_NAME);
    expect(options.concurrency).toBe(3);
    expect(options.connection).toBe(connection);
  });

  it("configura removeOnFail 500 e removeOnComplete 1000", () => {
    const connection = { maxRetriesPerRequest: null } as never;

    MakeCatalogPersistWorkerFactory.create({ repository, connection });

    const options = workerConstructorCalls[0]?.[2] as {
      removeOnFail: { count: number };
      removeOnComplete: { count: number };
    };
    expect(options.removeOnFail.count).toBe(
      MovieCatalogPersistConstants.REMOVE_ON_FAIL_COUNT,
    );
    expect(options.removeOnComplete.count).toBe(
      MovieCatalogPersistConstants.REMOVE_ON_COMPLETE_COUNT,
    );
  });

  it("defaultJobOptions expõe 4 tentativas e backoff custom", () => {
    const jobOptions = MakeCatalogPersistWorkerFactory.defaultJobOptions();

    expect(jobOptions.attempts).toBe(4);
    expect(jobOptions.backoff).toEqual({ type: "custom" });
  });

  it("backoffDelayMs segue BACKOFF_DELAYS_MS (15s, 1min, 5min)", () => {
    const delay15s = MakeCatalogPersistWorkerFactory.backoffDelayMs(1);
    const delay1min = MakeCatalogPersistWorkerFactory.backoffDelayMs(2);
    const delay5min = MakeCatalogPersistWorkerFactory.backoffDelayMs(3);

    expect(delay15s).toBe(15_000);
    expect(delay1min).toBe(60_000);
    expect(delay5min).toBe(300_000);
  });

  it("registra backoffStrategy no Worker", () => {
    const connection = { maxRetriesPerRequest: null } as never;

    MakeCatalogPersistWorkerFactory.create({ repository, connection });

    const options = workerConstructorCalls[0]?.[2] as {
      settings: { backoffStrategy: (attemptsMade: number) => number };
    };
    const backoffStrategy = options.settings.backoffStrategy;
    expect(backoffStrategy(1)).toBe(15_000);
    expect(backoffStrategy(2)).toBe(60_000);
  });

  it("processor do Worker delega para CatalogPersistProcessor.process", async () => {
    const connection = { maxRetriesPerRequest: null } as never;
    const jobData = { language: "pt-BR", details: { tmdbId: 157336 } };

    MakeCatalogPersistWorkerFactory.create({ repository, connection });

    const processorFn = workerConstructorCalls[0]?.[1] as (
      job: { data: unknown },
    ) => Promise<void>;
    await processorFn({ data: jobData });

    expect(processorProcessMock).toHaveBeenCalledWith(jobData);
  });

  it("cria connection com maxRetriesPerRequest null quando omitida", () => {
    const sourcePath = join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/catalog-persist-bullmq.connection.ts",
    );
    const source = readFileSync(sourcePath, "utf8");

    expect(source).toContain("maxRetriesPerRequest: null");
  });
});
