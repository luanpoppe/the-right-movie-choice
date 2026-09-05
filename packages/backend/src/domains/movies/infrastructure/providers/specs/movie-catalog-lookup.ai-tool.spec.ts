import { describe, it, expect, vi, beforeEach } from "vitest";
import type { z } from "zod";
import type { MovieCatalogLookupResult } from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
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
  static hit(title: string): MovieCatalogLookupResult {
    return {
      found: true,
      details: {
        tmdbId: 1,
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

describe("MovieCatalogLookupAiTool", () => {
  let catalogLookup: MovieCatalogLookupService;
  let findDetailsByTitle: ReturnType<typeof vi.fn>;
  let toolExecute: (input: LookupMoviesToolInput) => Promise<MovieCatalogLookupResult[]>;

  beforeEach(() => {
    vi.clearAllMocks();
    findDetailsByTitle = vi.fn();
    catalogLookup = {
      findDetailsByTitle,
    } as unknown as MovieCatalogLookupService;

    const aiTool = new MovieCatalogLookupAiTool(catalogLookup);
    aiTool.createLookupMoviesTool();
    const captured = toolCapture.config;
    if (captured === undefined) {
      throw new Error("lookupMovies tool was not captured");
    }
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

    findDetailsByTitle
      .mockResolvedValueOnce(hitFirst)
      .mockResolvedValueOnce(miss)
      .mockResolvedValueOnce(hitThird);

    const results = await toolExecute({
      queries: [
        { query: "Alpha", year: 2010 },
        { query: "Beta" },
        { query: "Gamma" },
      ],
    });

    expect(results).toEqual([hitFirst, miss, hitThird]);
    expect(findDetailsByTitle).toHaveBeenCalledTimes(3);
    expect(findDetailsByTitle).toHaveBeenNthCalledWith(1, {
      query: "Alpha",
      year: 2010,
    });
    expect(findDetailsByTitle).toHaveBeenNthCalledWith(2, { query: "Beta" });
    expect(findDetailsByTitle).toHaveBeenNthCalledWith(3, { query: "Gamma" });
  });

  it("repassa language da query para o lookup", async () => {
    const hit = MovieCatalogLookupAiToolFixtures.hit("Interstellar");
    findDetailsByTitle.mockResolvedValue(hit);

    await toolExecute({
      queries: [{ query: "Interstellar", language: "en-US" }],
    });

    expect(findDetailsByTitle).toHaveBeenCalledWith({
      query: "Interstellar",
      language: "en-US",
    });
  });

  it("REQ-1: dispara lookups em paralelo via Promise.all", async () => {
    const resolvers: Array<(value: MovieCatalogLookupResult) => void> = [];
    findDetailsByTitle.mockImplementation(
      () =>
        new Promise<MovieCatalogLookupResult>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const pending = toolExecute({
      queries: [{ query: "A" }, { query: "B" }],
    });

    expect(findDetailsByTitle).toHaveBeenCalledTimes(2);
    expect(resolvers).toHaveLength(2);

    const hitA = MovieCatalogLookupAiToolFixtures.hit("A");
    const hitB = MovieCatalogLookupAiToolFixtures.hit("B");
    resolvers[0]!(hitA);
    resolvers[1]!(hitB);

    const results = await pending;
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

    findDetailsByTitle
      .mockResolvedValueOnce(emptyQueryMiss)
      .mockResolvedValueOnce(hit);

    const results = await toolExecute({
      queries: [{ query: "" }, { query: "Inception", year: 2010 }],
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(emptyQueryMiss);
    expect(results[1]).toEqual(hit);
    expect(findDetailsByTitle).toHaveBeenNthCalledWith(1, { query: "" });
  });

  it("miss em um lookup não impede os demais de completarem", async () => {
    const hit = MovieCatalogLookupAiToolFixtures.hit("OK");
    const tmdbDownMiss = MovieCatalogLookupAiToolFixtures.miss(
      "O catálogo de filmes está temporariamente indisponível. Tente novamente mais tarde.",
    );

    findDetailsByTitle
      .mockResolvedValueOnce(hit)
      .mockResolvedValueOnce(tmdbDownMiss)
      .mockResolvedValueOnce(hit);

    const results = await toolExecute({
      queries: [{ query: "A" }, { query: "B" }, { query: "C" }],
    });

    expect(results).toEqual([hit, tmdbDownMiss, hit]);
    expect(findDetailsByTitle).toHaveBeenCalledTimes(3);
  });

  it("loga sucesso do batch sem expor corpo de prompt", async () => {
    findDetailsByTitle.mockResolvedValue(
      MovieCatalogLookupAiToolFixtures.hit("Inception"),
    );

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
});
