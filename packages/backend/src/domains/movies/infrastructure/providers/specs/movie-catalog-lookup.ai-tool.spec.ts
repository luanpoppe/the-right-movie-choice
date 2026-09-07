import { describe, it, expect, vi, beforeEach } from "vitest";
import type { z } from "zod";
import type { MovieCatalogLookupResult } from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import type { IUserMovieEntryRepository } from "@/domains/movies/domain/repositories/user-movie-entry.repository";
import { Logger } from "@/lib/logger/logger";
import { MovieCatalogLookupAiTool } from "../movie-catalog-lookup.ai-tool";
import { MovieCatalogLookupService } from "../movie-catalog-lookup.service";

type LookupMoviesToolInput = {
  queries: Array<{ query: string; year?: number; language?: string }>;
};

type CapturedToolConfig = {
  name: string;
  description: string;
  schema: z.ZodType<LookupMoviesToolInput>;
  toolFunction: (input: LookupMoviesToolInput) => Promise<MovieCatalogLookupResult[]>;
};

class MovieCatalogLookupAiToolFixtures {
  static hit(title: string, tmdbId = 1): MovieCatalogLookupResult {
    return {
      found: true,
      details: {
        tmdbId,
        title,
        year: 2010,
        posterPath: "/poster.jpg",
        overview: "Sinopse",
        runtimeMinutes: 120,
        genres: ["Drama"],
        tmdbVoteAverage: 8,
        originCountries: ["US"],
        directors: ["Director"],
        cast: ["Actor"],
        watchProviders: { flatrate: [], rent: [], buy: [] },
        imdbId: "tt0000001",
      },
    };
  }

  static miss(message: string): MovieCatalogLookupResult {
    return { found: false, message };
  }
}

const toolCapture: { config: CapturedToolConfig | undefined } = {
  config: undefined,
};

vi.mock("@luanpoppe/ai", () => ({
  AITools: class AITools {
    createTool(config: CapturedToolConfig) {
      toolCapture.config = config;
      return {
        name: config.name,
        description: config.description,
        execute: config.toolFunction,
      };
    }
  },
}));

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function captureLookupMoviesTool(
  catalogLookup: MovieCatalogLookupService,
  options?: {
    userMovieEntryRepository?: IUserMovieEntryRepository;
    userId?: number;
    excludeWatched?: boolean;
  },
): CapturedToolConfig {
  const aiTool = new MovieCatalogLookupAiTool(catalogLookup, options);
  aiTool.createLookupMoviesTool();
  const captured = toolCapture.config;
  if (captured === undefined) {
    throw new Error("lookupMovies tool was not captured");
  }
  return captured;
}

describe("MovieCatalogLookupAiTool", () => {
  let catalogLookup: MovieCatalogLookupService;
  let findDetailsByTitlesBatch: ReturnType<typeof vi.fn>;
  let toolExecute: (input: LookupMoviesToolInput) => Promise<MovieCatalogLookupResult[]>;

  beforeEach(() => {
    vi.clearAllMocks();
    findDetailsByTitlesBatch = vi.fn();
    catalogLookup = {
      findDetailsByTitlesBatch,
    } as unknown as MovieCatalogLookupService;

    const captured = captureLookupMoviesTool(catalogLookup);
    toolExecute = captured.toolFunction;
  });

  it("expõe lookupMovies com descrição de batch paralelo", () => {
    expect(toolCapture.config?.name).toBe("lookupMovies");
    expect(toolCapture.config?.description).toContain("paralelo");
    expect(toolCapture.config?.description).toContain("mesma ordem");
  });

  it("REQ-1: devolve resultados na mesma ordem das queries (hit, miss, hit)", async () => {
    const hitFirst = MovieCatalogLookupAiToolFixtures.hit("Alpha");
    const miss = MovieCatalogLookupAiToolFixtures.miss("Não encontrado");
    const hitThird = MovieCatalogLookupAiToolFixtures.hit("Gamma");

    findDetailsByTitlesBatch.mockResolvedValue([hitFirst, miss, hitThird]);

    const results = await toolExecute({
      queries: [
        { query: "Alpha", year: 2010 },
        { query: "Beta" },
        { query: "Gamma" },
      ],
    });

    expect(results).toEqual([hitFirst, miss, hitThird]);
    expect(findDetailsByTitlesBatch).toHaveBeenCalledTimes(1);
    expect(findDetailsByTitlesBatch).toHaveBeenCalledWith([
      { query: "Alpha", year: 2010 },
      { query: "Beta" },
      { query: "Gamma" },
    ]);
  });

  it("repassa language da query para o lookup", async () => {
    const hit = MovieCatalogLookupAiToolFixtures.hit("Interstellar");
    findDetailsByTitlesBatch.mockResolvedValue([hit]);

    await toolExecute({
      queries: [{ query: "Interstellar", language: "en-US" }],
    });

    expect(findDetailsByTitlesBatch).toHaveBeenCalledWith([
      { query: "Interstellar", language: "en-US" },
    ]);
  });

  it("delega todas as queries em uma única chamada a findDetailsByTitlesBatch", async () => {
    const hitA = MovieCatalogLookupAiToolFixtures.hit("A");
    const hitB = MovieCatalogLookupAiToolFixtures.hit("B");
    findDetailsByTitlesBatch.mockResolvedValue([hitA, hitB]);

    const results = await toolExecute({
      queries: [{ query: "A" }, { query: "B" }],
    });

    expect(findDetailsByTitlesBatch).toHaveBeenCalledTimes(1);
    expect(findDetailsByTitlesBatch).toHaveBeenCalledWith([
      { query: "A" },
      { query: "B" },
    ]);
    expect(results).toEqual([hitA, hitB]);
  });

  it("rejeita queries vazias no schema Zod (min 1)", () => {
    const parseResult = toolCapture.config!.schema.safeParse({ queries: [] });

    expect(parseResult.success).toBe(false);
  });

  it("rejeita mais de 8 queries no schema Zod (max 8)", () => {
    const nineQueries = Array.from({ length: 9 }, (_, index) => ({
      query: `Filme ${index + 1}`,
    }));
    const parseResult = toolCapture.config!.schema.safeParse({
      queries: nineQueries,
    });

    expect(parseResult.success).toBe(false);
  });

  it("aceita de 1 a 8 queries no schema Zod", () => {
    const oneQuery = toolCapture.config!.schema.safeParse({
      queries: [{ query: "Inception" }],
    });
    const eightQueries = toolCapture.config!.schema.safeParse({
      queries: Array.from({ length: 8 }, (_, index) => ({
        query: `Filme ${index + 1}`,
      })),
    });

    expect(oneQuery.success).toBe(true);
    expect(eightQueries.success).toBe(true);
  });

  it("mantém índice com found false quando query do item é vazia", async () => {
    const emptyQueryMiss = MovieCatalogLookupAiToolFixtures.miss(
      "Informe o nome de um filme para buscar no catálogo.",
    );
    const hit = MovieCatalogLookupAiToolFixtures.hit("Inception");

    findDetailsByTitlesBatch.mockResolvedValue([emptyQueryMiss, hit]);

    const results = await toolExecute({
      queries: [{ query: "" }, { query: "Inception", year: 2010 }],
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(emptyQueryMiss);
    expect(results[1]).toEqual(hit);
    expect(findDetailsByTitlesBatch).toHaveBeenCalledWith([
      { query: "" },
      { query: "Inception", year: 2010 },
    ]);
  });

  it("miss em um lookup não impede os demais de completarem", async () => {
    const hit = MovieCatalogLookupAiToolFixtures.hit("OK");
    const tmdbDownMiss = MovieCatalogLookupAiToolFixtures.miss(
      "O catálogo de filmes está temporariamente indisponível. Tente novamente mais tarde.",
    );

    findDetailsByTitlesBatch.mockResolvedValue([hit, tmdbDownMiss, hit]);

    const results = await toolExecute({
      queries: [{ query: "A" }, { query: "B" }, { query: "C" }],
    });

    expect(results).toEqual([hit, tmdbDownMiss, hit]);
    expect(findDetailsByTitlesBatch).toHaveBeenCalledTimes(1);
  });

  it("loga sucesso do batch sem expor corpo de prompt", async () => {
    findDetailsByTitlesBatch.mockResolvedValue([
      MovieCatalogLookupAiToolFixtures.hit("Inception"),
    ]);

    await toolExecute({ queries: [{ query: "Inception" }] });

    expect(Logger.info).toHaveBeenCalledWith(
      "Lookup batch no catálogo concluído",
      expect.objectContaining({ success: true, queryCount: 1 }),
    );
    const logContext = vi.mocked(Logger.info).mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(logContext).not.toHaveProperty("prompt");
    expect(logContext).not.toHaveProperty("systemPrompt");
  });

  describe("modo exclude-watched", () => {
    let findWatchedTmdbIdsByUser: ReturnType<typeof vi.fn>;
    let userMovieEntryRepository: IUserMovieEntryRepository;
    let excludeToolExecute: (
      input: LookupMoviesToolInput,
    ) => Promise<MovieCatalogLookupResult[]>;
    let excludeToolSchema: z.ZodType<LookupMoviesToolInput>;

    beforeEach(() => {
      findWatchedTmdbIdsByUser = vi.fn();
      userMovieEntryRepository = {
        findWatchedTmdbIdsByUser,
      } as unknown as IUserMovieEntryRepository;

      const captured = captureLookupMoviesTool(catalogLookup, {
        userMovieEntryRepository,
        userId: 42,
        excludeWatched: true,
      });
      excludeToolExecute = captured.toolFunction;
      excludeToolSchema = captured.schema;
    });

    it("REQ-6: substitui hits assistidos por miss preservando ordem e comprimento", async () => {
      const watchedHit = MovieCatalogLookupAiToolFixtures.hit("Assistido", 100);
      const unwatchedHit = MovieCatalogLookupAiToolFixtures.hit(
        "Não assistido",
        200,
      );
      const miss = MovieCatalogLookupAiToolFixtures.miss("Não encontrado");

      findDetailsByTitlesBatch.mockResolvedValue([
        watchedHit,
        unwatchedHit,
        miss,
      ]);
      findWatchedTmdbIdsByUser.mockResolvedValue([100]);

      const results = await excludeToolExecute({
        queries: [
          { query: "Assistido" },
          { query: "Não assistido" },
          { query: "Desconhecido" },
        ],
      });

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        found: false,
        message: "Filme já assistido pelo usuário.",
      });
      expect(results[1]).toEqual(unwatchedHit);
      expect(results[2]).toEqual(miss);
      expect(findWatchedTmdbIdsByUser).toHaveBeenCalledWith(42, [100, 200]);
    });

    it("aceita até 25 queries no schema Zod e rejeita 26", () => {
      const twentyFiveQueries = Array.from({ length: 25 }, (_, index) => ({
        query: `Filme ${index + 1}`,
      }));
      const twentySixQueries = Array.from({ length: 26 }, (_, index) => ({
        query: `Filme ${index + 1}`,
      }));

      const validParse = excludeToolSchema.safeParse({
        queries: twentyFiveQueries,
      });
      const invalidParse = excludeToolSchema.safeParse({
        queries: twentySixQueries,
      });

      expect(validParse.success).toBe(true);
      expect(invalidParse.success).toBe(false);
    });

    it("chama findWatchedTmdbIdsByUser apenas com tmdbIds dos hits", async () => {
      const hitA = MovieCatalogLookupAiToolFixtures.hit("A", 10);
      const miss = MovieCatalogLookupAiToolFixtures.miss("Miss");
      const hitB = MovieCatalogLookupAiToolFixtures.hit("B", 20);

      findDetailsByTitlesBatch.mockResolvedValue([hitA, miss, hitB]);
      findWatchedTmdbIdsByUser.mockResolvedValue([]);

      await excludeToolExecute({
        queries: [{ query: "A" }, { query: "X" }, { query: "B" }],
      });

      expect(findWatchedTmdbIdsByUser).toHaveBeenCalledWith(42, [10, 20]);
    });

    it("excludeWatched=true sem userId não chama repositório nem filtra", async () => {
      const watchedHit = MovieCatalogLookupAiToolFixtures.hit("Assistido", 100);
      const unwatchedHit = MovieCatalogLookupAiToolFixtures.hit(
        "Não assistido",
        200,
      );

      findDetailsByTitlesBatch.mockResolvedValue([watchedHit, unwatchedHit]);

      const guestCaptured = captureLookupMoviesTool(catalogLookup, {
        userMovieEntryRepository,
        excludeWatched: true,
      });
      const guestExecute = guestCaptured.toolFunction;

      const results = await guestExecute({
        queries: [{ query: "Assistido" }, { query: "Não assistido" }],
      });

      expect(results).toEqual([watchedHit, unwatchedHit]);
      expect(findWatchedTmdbIdsByUser).not.toHaveBeenCalled();
    });

    it("excludeWatched=true sem repositório injetado não filtra e loga warn", async () => {
      const watchedHit = MovieCatalogLookupAiToolFixtures.hit("Assistido", 100);
      const unwatchedHit = MovieCatalogLookupAiToolFixtures.hit(
        "Não assistido",
        200,
      );

      findDetailsByTitlesBatch.mockResolvedValue([watchedHit, unwatchedHit]);

      const noRepoCaptured = captureLookupMoviesTool(catalogLookup, {
        userId: 42,
        excludeWatched: true,
      });
      const noRepoExecute = noRepoCaptured.toolFunction;

      const results = await noRepoExecute({
        queries: [{ query: "Assistido" }, { query: "Não assistido" }],
      });

      expect(results).toEqual([watchedHit, unwatchedHit]);
      expect(Logger.warn).toHaveBeenCalledWith(
        "Filtro de assistidos ignorado: repositório não injetado",
        { userId: 42 },
      );
    });

    it("edge: histórico de assistidos vazio não remove hits", async () => {
      const hitA = MovieCatalogLookupAiToolFixtures.hit("Filme A", 10);
      const hitB = MovieCatalogLookupAiToolFixtures.hit("Filme B", 20);

      findDetailsByTitlesBatch.mockResolvedValue([hitA, hitB]);
      findWatchedTmdbIdsByUser.mockResolvedValue([]);

      const results = await excludeToolExecute({
        queries: [{ query: "Filme A" }, { query: "Filme B" }],
      });

      expect(results).toEqual([hitA, hitB]);
      expect(findWatchedTmdbIdsByUser).toHaveBeenCalledWith(42, [10, 20]);
    });

    it("edge: miss de catálogo não aborta batch no modo exclude", async () => {
      const hit = MovieCatalogLookupAiToolFixtures.hit("OK", 10);
      const catalogMiss = MovieCatalogLookupAiToolFixtures.miss(
        "O catálogo de filmes está temporariamente indisponível. Tente novamente mais tarde.",
      );

      findDetailsByTitlesBatch.mockResolvedValue([hit, catalogMiss]);
      findWatchedTmdbIdsByUser.mockResolvedValue([]);

      const results = await excludeToolExecute({
        queries: [{ query: "OK" }, { query: "Indisponível" }],
      });

      expect(results).toEqual([hit, catalogMiss]);
      expect(findDetailsByTitlesBatch).toHaveBeenCalledTimes(1);
    });

    it("schema mantém max 8 quando excludeWatched=false mesmo com userId", () => {
      const defaultCaptured = captureLookupMoviesTool(catalogLookup, {
        userMovieEntryRepository,
        userId: 42,
        excludeWatched: false,
      });
      const nineQueries = Array.from({ length: 9 }, (_, index) => ({
        query: `Filme ${index + 1}`,
      }));

      const parseResult = defaultCaptured.schema.safeParse({
        queries: nineQueries,
      });

      expect(parseResult.success).toBe(false);
    });
  });
});
