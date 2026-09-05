import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { MovieCatalogImdbConflictException } from "@/domains/movies/domain/exceptions/movie-catalog-imdb-conflict.exception";
import { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { Logger } from "@/lib/logger/logger";
import { CatalogPersistProcessor } from "../catalog-persist.processor";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class CatalogPersistProcessorFixtures {
  static details(overrides: Partial<MovieCatalogDetails> = {}): MovieCatalogDetails {
    return {
      tmdbId: 157336,
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Sinopse completa",
      runtimeMinutes: 169,
      genres: ["Ficção científica"],
      tmdbVoteAverage: 8.4,
      originCountries: ["US"],
      directors: ["Christopher Nolan"],
      cast: ["Matthew McConaughey"],
      watchProviders: {
        flatrate: [],
        rent: [],
        buy: [],
      },
      imdbId: "tt0816692",
      ...overrides,
    };
  }

  static validJobData(language = "pt-BR") {
    const details = CatalogPersistProcessorFixtures.details();
    return {
      language,
      details,
    };
  }
}

describe("CatalogPersistProcessor", () => {
  let repository: IMovieCatalogRepository;
  let processor: CatalogPersistProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = {
      upsert: vi.fn().mockResolvedValue(undefined),
      findByTmdbId: vi.fn(),
      findByTitleAndYear: vi.fn(),
    };
    processor = new CatalogPersistProcessor(repository);
  });

  it("REQ-1: persiste Interestelar pt-BR chamando upsert com details e language", async () => {
    const details = CatalogPersistProcessorFixtures.details();
    const jobData = CatalogPersistProcessorFixtures.validJobData("pt-BR");

    await processor.process(jobData);

    expect(repository.upsert).toHaveBeenCalledWith(details, "pt-BR");
    expect(Logger.info).toHaveBeenCalledWith(
      "Catalog persist job completed",
      expect.objectContaining({
        success: true,
        tmdbId: 157336,
      }),
    );
    const logContext = vi.mocked(Logger.info).mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(typeof logContext.durationMs).toBe("number");
  });

  it.each([
    { label: "language ausente", payload: { details: CatalogPersistProcessorFixtures.details() } },
    { label: "language vazia", payload: { language: "", details: CatalogPersistProcessorFixtures.details() } },
    {
      label: "tmdbId ausente",
      payload: {
        language: "pt-BR",
        details: { ...CatalogPersistProcessorFixtures.details(), tmdbId: undefined },
      },
    },
  ])("REQ-6: payload inválido ($label) não chama upsert e resolve", async ({ payload }) => {
    await expect(processor.process(payload)).resolves.toBeUndefined();

    expect(repository.upsert).not.toHaveBeenCalled();
    expect(Logger.warn).toHaveBeenCalledWith("Invalid catalog persist job payload");
  });

  it("REQ-2: conflito IMDb resolve sem relançar", async () => {
    const jobData = CatalogPersistProcessorFixtures.validJobData("pt-BR");
    vi.mocked(repository.upsert).mockRejectedValue(
      new MovieCatalogImdbConflictException("tt0816692", "pt-BR"),
    );

    await expect(processor.process(jobData)).resolves.toBeUndefined();

    expect(Logger.warn).toHaveBeenCalledWith(
      "Movie catalog IMDb conflict during persist",
      {
        imdbId: "tt0816692",
        language: "pt-BR",
      },
    );
  });

  it("REQ-3: erro transitório de Postgres relança para retry da fila", async () => {
    const jobData = CatalogPersistProcessorFixtures.validJobData("pt-BR");
    const connectionError = new Error("ECONNREFUSED");
    vi.mocked(repository.upsert).mockRejectedValue(connectionError);

    await expect(processor.process(jobData)).rejects.toThrow("ECONNREFUSED");

    expect(Logger.error).toHaveBeenCalledWith(
      "Catalog persist job failed",
      expect.objectContaining({
        success: false,
        tmdbId: 157336,
        reason: "ECONNREFUSED",
      }),
    );
    const logContext = vi.mocked(Logger.error).mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(typeof logContext.durationMs).toBe("number");
  });

  it("não importa cliente TMDB", async () => {
    const processorPath = join(
      process.cwd(),
      "src/domains/movies/infrastructure/workers/catalog-persist.processor.ts",
    );
    const source = await readFile(processorPath, "utf8");

    expect(source).not.toMatch(/@\/modules\/tmdb/);
  });
});
