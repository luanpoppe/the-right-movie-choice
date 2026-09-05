import { describe, it, expect, vi, beforeEach } from "vitest";
import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieSearchHit, MovieSearchPage } from "@/domains/movies/domain/entities/movie-search.entity";
import { Logger } from "@/lib/logger/logger";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";
import { MovieCatalogLookupService } from "../movie-catalog-lookup.service";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class MovieCatalogLookupFixtures {
  static searchHit(overrides: Partial<MovieSearchHit> = {}): MovieSearchHit {
    return {
      id: 157336,
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Sinopse",
      ...overrides,
    };
  }

  static searchPage(results: MovieSearchHit[]): MovieSearchPage {
    return {
      page: 1,
      results,
    };
  }

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

describe("MovieCatalogLookupService", () => {
  let catalog: IMovieCatalogProvider;
  let service: MovieCatalogLookupService;

  beforeEach(() => {
    vi.clearAllMocks();
    catalog = {
      searchMovies: vi.fn(),
      getMovieDetails: vi.fn(),
    };
    service = new MovieCatalogLookupService(catalog);
  });

  describe("findDetailsByTitle", () => {
    it("REQ-1: devolve found true com MovieCatalogDetails ao encontrar hit na search", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(catalog.getMovieDetails).mockResolvedValue(details);

      const result = await service.findDetailsByTitle({ query: "Interestelar" });

      expect(result).toEqual({ found: true, details });
      expect(catalog.searchMovies).toHaveBeenCalledWith("Interestelar");
      expect(catalog.getMovieDetails).toHaveBeenCalledWith(hit.id);
      expect(catalog.getMovieDetails).toHaveBeenCalledTimes(1);
    });

    it("busca só pelo título quando year está ausente", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(catalog.getMovieDetails).mockResolvedValue(details);

      await service.findDetailsByTitle({ query: "Interestelar" });

      expect(catalog.searchMovies).toHaveBeenCalledWith("Interestelar");
    });

    it("passa year como filtro separado, sem colar no texto da query", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(catalog.getMovieDetails).mockResolvedValue(details);

      await service.findDetailsByTitle({ query: "Interestelar", year: 2014 });

      expect(catalog.searchMovies).toHaveBeenCalledWith("Interestelar", 1, 2014);
    });

    it("aceita imdbId null nos details e ainda retorna found true", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details({ imdbId: null });
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(catalog.getMovieDetails).mockResolvedValue(details);

      const result = await service.findDetailsByTitle({ query: "Interestelar" });

      expect(result).toEqual({ found: true, details });
    });

    it("REQ-2: devolve found false sem chamar getMovieDetails quando search não tem resultados", async () => {
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([]),
      );

      const result = await service.findDetailsByTitle({ query: "FilmeInexistente" });

      expect(result).toEqual({
        found: false,
        message: 'Nenhum filme encontrado para "FilmeInexistente".',
      });
      expect(catalog.searchMovies).toHaveBeenCalledWith("FilmeInexistente");
      expect(catalog.getMovieDetails).not.toHaveBeenCalled();
    });

    it.each([
      {
        phase: "searchMovies",
        setupMocks: (catalogMock: IMovieCatalogProvider) => {
          vi.mocked(catalogMock.searchMovies).mockRejectedValue(
            new TmdbHttpException("TMDB timeout", 504),
          );
        },
      },
      {
        phase: "getMovieDetails",
        setupMocks: (catalogMock: IMovieCatalogProvider) => {
          const hit = MovieCatalogLookupFixtures.searchHit();
          vi.mocked(catalogMock.searchMovies).mockResolvedValue(
            MovieCatalogLookupFixtures.searchPage([hit]),
          );
          vi.mocked(catalogMock.getMovieDetails).mockRejectedValue(
            new TmdbHttpException("TMDB 502", 502),
          );
        },
      },
    ])(
      "REQ-3: captura TmdbHttpException em $phase e devolve found false sem relançar",
      async ({ setupMocks }) => {
        setupMocks(catalog);

        const result = await service.findDetailsByTitle({ query: "Interestelar" });

        expect(result).toEqual({
          found: false,
          message:
            "O catálogo de filmes está temporariamente indisponível. Tente novamente mais tarde.",
        });
      },
    );

    it("REQ-3: registra TmdbHttpException no log sem body de prompt", async () => {
      vi.mocked(catalog.searchMovies).mockRejectedValue(
        new TmdbHttpException("TMDB timeout", 504),
      );

      await service.findDetailsByTitle({ query: "Interestelar" });

      expect(Logger.error).toHaveBeenCalledTimes(1);
      const logContext = vi.mocked(Logger.error).mock.calls[0]?.[1] as Record<
        string,
        unknown
      >;
      expect(logContext).toMatchObject({
        success: false,
        error: "TMDB timeout",
      });
      expect(typeof logContext.durationMs).toBe("number");
      expect(logContext).not.toHaveProperty("prompt");
      expect(logContext).not.toHaveProperty("systemPrompt");
      expect(logContext).not.toHaveProperty("messages");
    });

    it("devolve found true e registra sucesso no log", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(catalog.getMovieDetails).mockResolvedValue(details);

      await service.findDetailsByTitle({ query: "Interestelar" });

      expect(Logger.info).toHaveBeenCalledTimes(1);
      const logContext = vi.mocked(Logger.info).mock.calls[0]?.[1] as Record<
        string,
        unknown
      >;
      expect(logContext).toMatchObject({ success: true });
      expect(typeof logContext.durationMs).toBe("number");
    });

    it("devolve found false para query vazia sem chamar o catálogo", async () => {
      const result = await service.findDetailsByTitle({ query: "" });

      expect(result).toEqual({
        found: false,
        message: "Informe o nome de um filme para buscar no catálogo.",
      });
      expect(catalog.searchMovies).not.toHaveBeenCalled();
      expect(catalog.getMovieDetails).not.toHaveBeenCalled();
    });

    it("devolve found false para erro inesperado sem relançar", async () => {
      vi.mocked(catalog.searchMovies).mockRejectedValue(
        new Error("falha inesperada"),
      );

      const result = await service.findDetailsByTitle({ query: "Interestelar" });

      expect(result).toEqual({
        found: false,
        message: "Não foi possível consultar o catálogo de filmes no momento.",
      });
      expect(Logger.error).toHaveBeenCalledTimes(1);
    });
  });
});
