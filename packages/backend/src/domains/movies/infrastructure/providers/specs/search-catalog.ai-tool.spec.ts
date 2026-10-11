import { describe, it, expect, vi, beforeEach } from "vitest";
import type { z } from "zod";
import type { DiscoverCatalogMoviesUseCase } from "@/domains/movies/application/use-cases/discover-catalog-movies.use-case";
import type { SearchCatalogMoviesUseCase } from "@/domains/movies/application/use-cases/search-catalog-movies.use-case";
import type { MovieCatalogSearchToolResult } from "@/domains/movies/domain/entities/movie-catalog-search-tool.entity";
import type { MovieSearchHit } from "@/domains/movies/domain/entities/movie-search.entity";
import { MovieCatalogSearchValidationException } from "@/domains/movies/domain/movie-catalog-search.constants";
import { Logger } from "@/lib/logger/logger";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";
import { SearchCatalogAiTool } from "../search-catalog.ai-tool";

type CapturedToolConfig = {
  name: string;
  description: string;
  schema: z.ZodType<Record<string, unknown>>;
  toolFunction: (input: unknown) => Promise<MovieCatalogSearchToolResult>;
};

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

function searchHit(overrides: Partial<MovieSearchHit> = {}): MovieSearchHit {
  return {
    id: 157336,
    title: "Interstellar",
    year: 2014,
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    overview: "A team of explorers travel through a wormhole in space.",
    ...overrides,
  };
}

class SearchCatalogAiToolFixtures {
  static hit(overrides: Partial<MovieSearchHit> = {}): MovieSearchHit {
    return searchHit(overrides);
  }

  static searchPage(results: MovieSearchHit[]) {
    return { page: 1, results };
  }
}

describe("SearchCatalogAiTool", () => {
  let searchExecute: ReturnType<typeof vi.fn>;
  let discoverExecute: ReturnType<typeof vi.fn>;
  let toolExecute: (input: unknown) => Promise<MovieCatalogSearchToolResult>;
  let toolSchema: z.ZodType<Record<string, unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    searchExecute = vi.fn();
    discoverExecute = vi.fn();

    const searchCatalogMoviesUseCase = {
      execute: searchExecute,
    } as unknown as SearchCatalogMoviesUseCase;
    const discoverCatalogMoviesUseCase = {
      execute: discoverExecute,
    } as unknown as DiscoverCatalogMoviesUseCase;

    const aiTool = new SearchCatalogAiTool(
      searchCatalogMoviesUseCase,
      discoverCatalogMoviesUseCase,
    );
    aiTool.createSearchCatalogTool();

    const captured = toolCapture.config;
    if (captured === undefined) {
      throw new Error("searchCatalog tool was not captured");
    }
    toolExecute = captured.toolFunction;
    toolSchema = captured.schema;
  });

  it("expõe a tool searchCatalog", () => {
    expect(toolCapture.config?.name).toBe("searchCatalog");
  });

  describe("REQ-1: busca por texto", () => {
    it("busca por texto repassando query e year", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([
          SearchCatalogAiToolFixtures.hit(),
        ]),
      );

      const result = await toolExecute({
        query: "Interstellar",
        year: 2014,
      });

      expect(searchExecute).toHaveBeenCalledWith({
        query: "Interstellar",
        year: 2014,
      });
      expect(discoverExecute).not.toHaveBeenCalled();
      expect(result.found).toBe(true);
    });

    it("devolve hits com id, título, ano, overview e URL do pôster", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([
          SearchCatalogAiToolFixtures.hit(),
        ]),
      );

      const result = await toolExecute({ query: "Interstellar" });

      expect(result).toEqual({
        found: true,
        results: [
          {
            id: 157336,
            title: "Interstellar",
            year: 2014,
            overview: "A team of explorers travel through a wormhole in space.",
            posterUrl:
              "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
          },
        ],
      });
    });

    it("mapeia posterPath relativo para URL absoluta do TMDB", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([
          SearchCatalogAiToolFixtures.hit({ posterPath: "/poster.jpg" }),
        ]),
      );

      const result = await toolExecute({ query: "x" });

      expect(result.results[0]?.posterUrl).toBe(
        "https://image.tmdb.org/t/p/w500/poster.jpg",
      );
    });

    it("posterPath null vira posterUrl null", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([
          SearchCatalogAiToolFixtures.hit({ posterPath: null }),
        ]),
      );

      const result = await toolExecute({ query: "x" });

      expect(result.results[0]?.posterUrl).toBeNull();
    });

    it("modo texto não aciona o use case de discover", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({ query: "A Origem" });

      expect(searchExecute).toHaveBeenCalledTimes(1);
      expect(discoverExecute).not.toHaveBeenCalled();
    });
  });

  describe("REQ-2: populares", () => {
    it("sem query e sem filtros aciona os populares sem texto", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      const result = await toolExecute({});

      expect(searchExecute).toHaveBeenCalledWith({});
      expect(discoverExecute).not.toHaveBeenCalled();
      expect(result.found).toBe(true);
    });

    it("genres vazio sozinho não é filtro de discover (cai em populares)", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({ genres: [] });

      expect(searchExecute).toHaveBeenCalledWith({});
      expect(discoverExecute).not.toHaveBeenCalled();
    });
  });

  describe("REQ-3: discover por filtros", () => {
    it("repassa gêneros em ou, nota e faixa de lançamento ao discover", async () => {
      discoverExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([
          SearchCatalogAiToolFixtures.hit({ id: 525, title: "A Origem" }),
        ]),
      );

      const result = await toolExecute({
        genres: [28, 35],
        minRating: 7,
        yearFrom: 2010,
        yearTo: 2015,
      });

      expect(discoverExecute).toHaveBeenCalledWith({
        genres: [28, 35],
        minRating: 7,
        yearFrom: 2010,
        yearTo: 2015,
      });
      expect(searchExecute).not.toHaveBeenCalled();
      expect(result).toEqual({
        found: true,
        results: [
          {
            id: 525,
            title: "A Origem",
            year: 2014,
            overview: "A team of explorers travel through a wormhole in space.",
            posterUrl:
              "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
          },
        ],
      });
    });

    it("REQ-7: page 2 é repassada ao discover", async () => {
      discoverExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([]),
      );

      await toolExecute({ genres: [18], page: 2 });

      expect(discoverExecute).toHaveBeenCalledWith({
        genres: [18],
        page: 2,
      });
    });

    it("repassa duração e certificação ao discover sem query", async () => {
      discoverExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({
        runtimeFrom: 90,
        runtimeTo: 150,
        certificationCountry: "BR",
        certification: "14",
      });

      expect(discoverExecute).toHaveBeenCalledWith({
        runtimeFrom: 90,
        runtimeTo: 150,
        certificationCountry: "BR",
        certification: "14",
      });
    });

    it("edge: discover sem resultados é 200 vazio, não miss", async () => {
      discoverExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([]),
      );

      const result = await toolExecute({ genres: [999999] });

      expect(result.found).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.notice).toBe("Nenhum filme encontrado");
    });
  });

  describe("REQ-4: idioma por chamada", () => {
    it("language pt-BR é repassado na busca por texto", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({ query: "Interstellar", language: "pt-BR" });

      expect(searchExecute).toHaveBeenCalledWith({
        query: "Interstellar",
        language: "pt-BR",
      });
    });

    it("language pt-BR é repassado no discover", async () => {
      discoverExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({ genres: [18], language: "pt-BR" });

      expect(discoverExecute).toHaveBeenCalledWith({
        genres: [18],
        language: "pt-BR",
      });
    });

    it("language pt-BR é repassado nos populares", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({ language: "pt-BR" });

      expect(searchExecute).toHaveBeenCalledWith({ language: "pt-BR" });
    });

    it("sem language, a tool não envia idioma (default resolvido à jusante)", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({ query: "Interstellar" });

      const calledWith = searchExecute.mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      expect(calledWith).not.toHaveProperty("language");
    });
  });

  describe("REQ-5: TMDB indisponível", () => {
    it("falha do TmdbHttpException na busca por texto vira miss sem lançar", async () => {
      searchExecute.mockRejectedValue(
        new TmdbHttpException("TMDB esgotou os retries", 503),
      );

      const result = await toolExecute({ query: "Interstellar" });

      expect(result).toEqual({
        found: false,
        results: [],
        notice: "Catálogo indisponível no momento. Tente novamente.",
      });
    });

    it("falha do TmdbHttpException no discover vira miss sem lançar", async () => {
      discoverExecute.mockRejectedValue(
        new TmdbHttpException("TMDB esgotou os retries", 503),
      );

      const result = await toolExecute({ genres: [18] });

      expect(result).toEqual({
        found: false,
        results: [],
        notice: "Catálogo indisponível no momento. Tente novamente.",
      });
    });

    it("falha do TmdbHttpException nos populares vira miss sem lançar", async () => {
      searchExecute.mockRejectedValue(
        new TmdbHttpException("TMDB esgotou os retries", 503),
      );

      const result = await toolExecute({});

      expect(result.found).toBe(false);
      expect(result.notice).toBe(
        "Catálogo indisponível no momento. Tente novamente.",
      );
    });
  });

  describe("REQ-6: modos não se misturam", () => {
    it("query + genres devolve miss e não chama o TMDB", async () => {
      const result = await toolExecute({
        query: "Interstellar",
        genres: [28, 35],
      });

      expect(result).toEqual({
        found: false,
        results: [],
        notice:
          "query de texto e filtros de discover não podem ser usados na mesma chamada",
      });
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("query + minRating devolve miss sem chamar o TMDB", async () => {
      const result = await toolExecute({ query: "x", minRating: 7 });

      expect(result.found).toBe(false);
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("query + yearFrom devolve miss sem chamar o TMDB", async () => {
      const result = await toolExecute({ query: "x", yearFrom: 2010 });

      expect(result.found).toBe(false);
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("query + certificação devolve miss sem chamar o TMDB", async () => {
      const result = await toolExecute({
        query: "x",
        certificationCountry: "BR",
        certification: "14",
      });

      expect(result.found).toBe(false);
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("minRating fora de 0–10 (exceção do discover) vira miss", async () => {
      discoverExecute.mockRejectedValue(
        new MovieCatalogSearchValidationException(
          "minRating must be between 0 and 10, received 11",
        ),
      );

      const result = await toolExecute({ minRating: 11 });

      expect(result).toEqual({
        found: false,
        results: [],
        notice: "minRating must be between 0 and 10, received 11",
      });
    });

    it("anos invertidos (exceção do discover) vira miss", async () => {
      discoverExecute.mockRejectedValue(
        new MovieCatalogSearchValidationException(
          "yearFrom must not be greater than yearTo, received 2020 and 2010",
        ),
      );

      const result = await toolExecute({ yearFrom: 2020, yearTo: 2010 });

      expect(result.found).toBe(false);
      expect(result.notice).toBe(
        "yearFrom must not be greater than yearTo, received 2020 and 2010",
      );
    });

    it("certificação sem par (exceção do discover) vira miss", async () => {
      discoverExecute.mockRejectedValue(
        new MovieCatalogSearchValidationException(
          "certificationCountry and certification must be provided together or not at all",
        ),
      );

      const result = await toolExecute({ certificationCountry: "BR" });

      expect(result.found).toBe(false);
      expect(result.notice).toBe(
        "certificationCountry and certification must be provided together or not at all",
      );
    });

    it("id de gênero não positivo (exceção do discover) vira miss", async () => {
      discoverExecute.mockRejectedValue(
        new MovieCatalogSearchValidationException(
          "genres must be a positive integer, received -1",
        ),
      );

      const result = await toolExecute({ genres: [-1] });

      expect(result.found).toBe(false);
      expect(result.notice).toBe(
        "genres must be a positive integer, received -1",
      );
    });

    it("language inválido é rejeitado no schema Zod sem chamar o TMDB", async () => {
      const result = await toolExecute({ language: "es-ES", query: "x" });

      expect(result.found).toBe(false);
      expect(result.results).toEqual([]);
      expect(typeof result.notice).toBe("string");
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });
  });

  describe("REQ-7: página", () => {
    it("page 2 é repassada na busca por texto", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({ query: "Interstellar", page: 2 });

      expect(searchExecute).toHaveBeenCalledWith({
        query: "Interstellar",
        page: 2,
      });
    });

    it("page 2 é repassada nos populares", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([SearchCatalogAiToolFixtures.hit()]),
      );

      await toolExecute({ page: 2 });

      expect(searchExecute).toHaveBeenCalledWith({ page: 2 });
    });
  });

  describe("Code review M1-M3", () => {
    it("M1: schema enviado ao modelo aceita tipos inválidos sem lançar", () => {
      const parseResult = toolSchema.safeParse({
        query: 123,
        genres: "ação",
        cast: [6193],
        desconhecido: true,
      });

      expect(parseResult.success).toBe(true);
    });

    it("M1: entrada com tipo inválido retorna miss sem lançar", async () => {
      const result = await toolExecute({ genres: "ação" });

      expect(result.found).toBe(false);
      expect(result.results).toEqual([]);
      expect(typeof result.notice).toBe("string");
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("M2: year sem query de texto devolve miss", async () => {
      const result = await toolExecute({ year: 2014 });

      expect(result.found).toBe(false);
      expect(result.results).toEqual([]);
      expect(result.notice).toBe(
        "o ano só é aceito junto de uma busca por texto",
      );
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("M2: year com filtros de discover e sem query também devolve miss", async () => {
      const result = await toolExecute({ year: 2014, minRating: 8 });

      expect(result.found).toBe(false);
      expect(result.notice).toBe(
        "o ano só é aceito junto de uma busca por texto",
      );
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("M3: chave desconhecida (cast) devolve miss", async () => {
      const result = await toolExecute({ cast: [6193] });

      expect(result.found).toBe(false);
      expect(result.results).toEqual([]);
      expect(typeof result.notice).toBe("string");
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("M3: page menor que 1 devolve miss", async () => {
      const result = await toolExecute({ query: "x", page: 0 });

      expect(result.found).toBe(false);
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });

    it("M3: year não positivo devolve miss", async () => {
      const result = await toolExecute({ query: "x", year: -1 });

      expect(result.found).toBe(false);
      expect(searchExecute).not.toHaveBeenCalled();
      expect(discoverExecute).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("lista vazia na busca por texto é encontrado com aviso", async () => {
      searchExecute.mockResolvedValue(
        SearchCatalogAiToolFixtures.searchPage([]),
      );

      const result = await toolExecute({ query: "filme inexistente" });

      expect(result).toEqual({
        found: true,
        results: [],
        notice: "Nenhum filme encontrado",
      });
    });

    it("erro inesperado vira miss com mensagem genérica", async () => {
      searchExecute.mockRejectedValue(new Error("boom"));

      const result = await toolExecute({ query: "x" });

      expect(result).toEqual({
        found: false,
        results: [],
        notice: "Falha ao consultar o catálogo: boom",
      });
    });

    it("valor não-Error lançado vira miss com String()", async () => {
      searchExecute.mockRejectedValue("falha crua");

      const result = await toolExecute({ query: "x" });

      expect(result).toEqual({
        found: false,
        results: [],
        notice: "Falha ao consultar o catálogo: falha crua",
      });
    });

    it("schema aceita entrada vazia", () => {
      const parseResult = toolSchema.safeParse({});

      expect(parseResult.success).toBe(true);
    });
  });
});
