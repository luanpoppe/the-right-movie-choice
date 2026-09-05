import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { MovieCatalogPersistConstants } from "@/domains/movies/domain/movie-catalog-persist.constants";
import { Logger } from "@/lib/logger/logger";

const { queueAddMock, getQueueMock } = vi.hoisted(() => ({
  queueAddMock: vi.fn().mockResolvedValue(undefined),
  getQueueMock: vi.fn(),
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
  "@/domains/movies/infrastructure/factories/make-catalog-persist-queue.factory",
  () => ({
    MakeCatalogPersistQueueFactory: {
      getQueue: getQueueMock,
    },
  }),
);

vi.mock(
  "@/domains/movies/infrastructure/factories/make-catalog-persist-worker.factory",
  () => ({
    MakeCatalogPersistWorkerFactory: {
      defaultJobOptions: vi.fn().mockReturnValue({
        attempts: 4,
        backoff: { type: "custom" },
      }),
    },
  }),
);

import { CatalogPersistEnqueuer } from "../catalog-persist.enqueuer";
import { MakeCatalogPersistWorkerFactory } from "@/domains/movies/infrastructure/factories/make-catalog-persist-worker.factory";
import { MakeCatalogPersistQueueFactory } from "@/domains/movies/infrastructure/factories/make-catalog-persist-queue.factory";

class CatalogPersistEnqueuerFixtures {
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
}

describe("CatalogPersistEnqueuer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queueAddMock.mockResolvedValue(undefined);
    getQueueMock.mockReturnValue({ add: queueAddMock });
  });

  it("REQ-7: enqueue válido chama add com jobId, payload e options corretos", async () => {
    const details = CatalogPersistEnqueuerFixtures.details();
    const language = "pt-BR";
    const jobId = MovieCatalogPersistConstants.jobId(157336, language);

    await CatalogPersistEnqueuer.enqueue(details, language);

    expect(MakeCatalogPersistQueueFactory.getQueue).toHaveBeenCalledTimes(1);
    expect(queueAddMock).toHaveBeenCalledTimes(1);
    expect(queueAddMock).toHaveBeenCalledWith(
      "persist",
      { language, details },
      { jobId, attempts: 4, backoff: { type: "custom" } },
    );
    expect(MakeCatalogPersistWorkerFactory.defaultJobOptions).toHaveBeenCalledTimes(
      1,
    );
    expect(Logger.info).toHaveBeenCalledWith("Catalog persist job enqueued", {
      tmdbId: 157336,
      language,
      jobId,
    });
  });

  it("REQ-7: tmdbId ausente loga warn e não chama add", async () => {
    const details = CatalogPersistEnqueuerFixtures.details({
      tmdbId: undefined as unknown as number,
    });

    await CatalogPersistEnqueuer.enqueue(details, "pt-BR");

    expect(getQueueMock).not.toHaveBeenCalled();
    expect(queueAddMock).not.toHaveBeenCalled();
    expect(Logger.warn).toHaveBeenCalledWith(
      "Skipping catalog persist enqueue: invalid tmdbId or language",
      { language: "pt-BR" },
    );
  });

  it("REQ-7: language vazia loga warn e não chama add", async () => {
    const details = CatalogPersistEnqueuerFixtures.details();

    await CatalogPersistEnqueuer.enqueue(details, "");

    expect(getQueueMock).not.toHaveBeenCalled();
    expect(queueAddMock).not.toHaveBeenCalled();
    expect(Logger.warn).toHaveBeenCalledWith(
      "Skipping catalog persist enqueue: invalid tmdbId or language",
      { language: "" },
    );
  });

  it("REQ-2: falha no add loga warn e não relança erro", async () => {
    const details = CatalogPersistEnqueuerFixtures.details();
    const language = "pt-BR";
    queueAddMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      CatalogPersistEnqueuer.enqueue(details, language),
    ).resolves.toBeUndefined();

    expect(Logger.warn).toHaveBeenCalledWith(
      "Failed to enqueue catalog persist job",
      {
        tmdbId: 157336,
        language,
        reason: "ECONNREFUSED",
      },
    );
  });

  it("REQ-6: jobId duplicado no add não propaga erro ao caller", async () => {
    const details = CatalogPersistEnqueuerFixtures.details();
    const language = "pt-BR";
    queueAddMock.mockRejectedValue(new Error("Job already exists"));

    await expect(
      CatalogPersistEnqueuer.enqueue(details, language),
    ).resolves.toBeUndefined();

    expect(Logger.warn).toHaveBeenCalledWith(
      "Failed to enqueue catalog persist job",
      {
        tmdbId: 157336,
        language,
        reason: "Job already exists",
      },
    );
  });
});
