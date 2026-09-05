import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "@/lib/logger/logger";
import { MovieCatalogPersistConstants } from "@/domains/movies/domain/movie-catalog-persist.constants";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock(
  "@/domains/movies/infrastructure/factories/make-catalog-persist-worker.factory",
  () => ({
    MakeCatalogPersistWorkerFactory: {
      create: createMock,
    },
  }),
);

vi.mock(
  "@/domains/movies/infrastructure/repositories/movie-catalog/prisma-movie-catalog.repository",
  () => ({
    PrismaMovieCatalogRepository: class PrismaMovieCatalogRepository {},
  }),
);

import { CatalogPersistWorkerStarter } from "../start-catalog-persist-worker";

describe("CatalogPersistWorkerStarter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REQ-5: inicia o worker e loga fila e concurrency", () => {
    const worker = { close: vi.fn() };
    createMock.mockReturnValue(worker);

    const result = CatalogPersistWorkerStarter.start();

    expect(result).toBe(worker);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(Logger.info).toHaveBeenCalledWith("Catalog persist worker started", {
      queueName: MovieCatalogPersistConstants.QUEUE_NAME,
      concurrency: MovieCatalogPersistConstants.CONCURRENCY,
    });
  });

  it("REQ-5: falha no boot loga warn e retorna null sem relançar", () => {
    createMock.mockImplementation(() => {
      throw new Error("ECONNREFUSED");
    });

    const result = CatalogPersistWorkerStarter.start();

    expect(result).toBeNull();
    expect(Logger.warn).toHaveBeenCalledWith(
      "Catalog persist worker failed to start, HTTP will continue without job processing",
      { reason: "ECONNREFUSED" },
    );
  });
});
