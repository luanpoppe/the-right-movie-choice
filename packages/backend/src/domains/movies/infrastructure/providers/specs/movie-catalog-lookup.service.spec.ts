import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieSearchHit, MovieSearchPage } from "@/domains/movies/domain/entities/movie-search.entity";
import { MovieCatalogFreshnessUtils } from "@/domains/movies/domain/movie-catalog-freshness.utils";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  IMovieCatalogRepository,
  MovieCatalogStoredRecord,
} from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { Logger } from "@/lib/logger/logger";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import { MovieCatalogDetailsResolver } from "../movie-catalog-details.resolver";
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

  static storedRecord(
    details: MovieCatalogDetails,
    updatedAt: Date,
  ): MovieCatalogStoredRecord {
    return {
      details,
      updatedAt,
    };
  }

  static freshUpdatedAt(now: Date): Date {
    const freshForMs = MovieCatalogFreshnessUtils.FRESH_FOR_MS;
    const updatedAtMs = now.getTime() - freshForMs + 1;
    return new Date(updatedAtMs);
  }

  static staleUpdatedAt(now: Date): Date {
    const freshForMs = MovieCatalogFreshnessUtils.FRESH_FOR_MS;
    const updatedAtMs = now.getTime() - freshForMs;
    return new Date(updatedAtMs);
  }
}

describe("MovieCatalogLookupService", () => {
  const now = new Date("2026-09-05T12:00:00.000Z");

  let catalog: IMovieCatalogProvider;
  let repository: IMovieCatalogRepository;
  let cache: TmdbMovieDetailsCache;
  let resolver: MovieCatalogDetailsResolver;
  let service: MovieCatalogLookupService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    catalog = {
      searchMovies: vi.fn(),
      getMovieDetails: vi.fn(),
    };
    repository = {
      upsert: vi.fn(),
      findByTmdbId: vi.fn(),
      findByTitleAndYear: vi.fn().mockResolvedValue(null),
    };
    cache = {
      buildKey: vi.fn(),
      get: vi.fn(),
      set: vi.fn().mockResolvedValue(undefined),
    } as unknown as TmdbMovieDetailsCache;
    resolver = {
      resolveByTmdbId: vi.fn(),
    } as unknown as MovieCatalogDetailsResolver;

    service = new MovieCatalogLookupService(
      catalog,
      repository,
      cache,
      resolver,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("findDetailsByTitle", () => {
    it("REQ-1: devolve found true com MovieCatalogDetails ao encontrar hit na search", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

      const result = await service.findDetailsByTitle({ query: "Interestelar" });

      expect(result).toEqual({ found: true, details });
      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "Interestelar",
        1,
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(resolver.resolveByTmdbId).toHaveBeenCalledWith(
        hit.id,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(resolver.resolveByTmdbId).toHaveBeenCalledTimes(1);
    });

    it("busca só pelo título quando year está ausente", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

      await service.findDetailsByTitle({ query: "Interestelar" });

      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "Interestelar",
        1,
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
    });

    it("passa year como filtro separado, sem colar no texto da query", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

      await service.findDetailsByTitle({ query: "Interestelar", year: 2014 });

      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "Interestelar",
        1,
        2014,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
    });

    it("aceita imdbId null nos details e ainda retorna found true", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details({ imdbId: null });
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

      const result = await service.findDetailsByTitle({ query: "Interestelar" });

      expect(result).toEqual({ found: true, details });
    });

    it("REQ-2: devolve found false sem chamar resolver quando search não tem resultados", async () => {
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([]),
      );

      const result = await service.findDetailsByTitle({ query: "FilmeInexistente" });

      expect(result).toEqual({
        found: false,
        message: 'Nenhum filme encontrado para "FilmeInexistente".',
      });
      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "FilmeInexistente",
        1,
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
    });

    it.each([
      {
        phase: "searchMovies",
        setupMocks: (
          catalogMock: IMovieCatalogProvider,
          _resolverMock: MovieCatalogDetailsResolver,
        ) => {
          vi.mocked(catalogMock.searchMovies).mockRejectedValue(
            new TmdbHttpException("TMDB timeout", 504),
          );
        },
      },
      {
        phase: "resolveByTmdbId",
        setupMocks: (
          catalogMock: IMovieCatalogProvider,
          resolverMock: MovieCatalogDetailsResolver,
        ) => {
          const hit = MovieCatalogLookupFixtures.searchHit();
          vi.mocked(catalogMock.searchMovies).mockResolvedValue(
            MovieCatalogLookupFixtures.searchPage([hit]),
          );
          vi.mocked(resolverMock.resolveByTmdbId).mockRejectedValue(
            new TmdbHttpException("TMDB 502", 502),
          );
        },
      },
    ])(
      "REQ-3: captura TmdbHttpException em $phase e devolve found false sem relançar",
      async ({ setupMocks, phase }) => {
        setupMocks(catalog, resolver);

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
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

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
      expect(repository.findByTitleAndYear).not.toHaveBeenCalled();
      expect(catalog.searchMovies).not.toHaveBeenCalled();
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
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

    it("REQ-1 local: hit fresco no banco não chama searchMovies, aquece cache e devolve details", async () => {
      const details = MovieCatalogLookupFixtures.details();
      const updatedAt = MovieCatalogLookupFixtures.freshUpdatedAt(now);
      const storedRecord = MovieCatalogLookupFixtures.storedRecord(
        details,
        updatedAt,
      );
      vi.mocked(repository.findByTitleAndYear).mockResolvedValue(storedRecord);

      const result = await service.findDetailsByTitle({ query: "Interestelar" });

      expect(result).toEqual({ found: true, details });
      expect(repository.findByTitleAndYear).toHaveBeenCalledWith(
        "Interestelar",
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(catalog.searchMovies).not.toHaveBeenCalled();
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        details.tmdbId,
        details,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
    });

    it("REQ-4 local: registro stale no banco cai no search TMDB e resolver", async () => {
      const details = MovieCatalogLookupFixtures.details();
      const staleUpdatedAt = MovieCatalogLookupFixtures.staleUpdatedAt(now);
      const storedRecord = MovieCatalogLookupFixtures.storedRecord(
        details,
        staleUpdatedAt,
      );
      const hit = MovieCatalogLookupFixtures.searchHit();
      const tmdbDetails = MovieCatalogLookupFixtures.details({
        overview: "Sinopse TMDB atualizada",
      });
      vi.mocked(repository.findByTitleAndYear).mockResolvedValue(storedRecord);
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(tmdbDetails);

      const result = await service.findDetailsByTitle({ query: "Interestelar" });

      expect(result).toEqual({ found: true, details: tmdbDetails });
      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "Interestelar",
        1,
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(resolver.resolveByTmdbId).toHaveBeenCalledWith(
        hit.id,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
    });

    it("REQ-5: findByTitleAndYear falha, loga warn e segue para search TMDB", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(repository.findByTitleAndYear).mockRejectedValue(
        new Error("Postgres indisponível"),
      );
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

      const result = await service.findDetailsByTitle({ query: "Interestelar" });

      expect(result).toEqual({ found: true, details });
      expect(Logger.warn).toHaveBeenCalledWith(
        "Movie catalog findByTitleAndYear failed, skipping to TMDB",
        expect.objectContaining({
          title: "Interestelar",
          reason: "Postgres indisponível",
        }),
      );
      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "Interestelar",
        1,
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(resolver.resolveByTmdbId).toHaveBeenCalledWith(
        hit.id,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
    });

    it("REQ-2: miss local consulta TMDB, pega 1º hit e resolve details", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit({
        id: 438631,
        title: "Duna",
        year: 2021,
      });
      const details = MovieCatalogLookupFixtures.details({
        tmdbId: 438631,
        title: "Duna",
        year: 2021,
      });
      vi.mocked(repository.findByTitleAndYear).mockResolvedValue(null);
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

      const result = await service.findDetailsByTitle({ query: "Duna" });

      expect(result).toEqual({ found: true, details });
      expect(repository.findByTitleAndYear).toHaveBeenCalledWith(
        "Duna",
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "Duna",
        1,
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(resolver.resolveByTmdbId).toHaveBeenCalledWith(
        hit.id,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
    });

    it("edge language omitido: find local e TMDB usam pt-BR por padrão", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details();
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

      await service.findDetailsByTitle({ query: "Interestelar" });

      expect(repository.findByTitleAndYear).toHaveBeenCalledWith(
        "Interestelar",
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "Interestelar",
        1,
        undefined,
        DEFAULT_MOVIE_CATALOG_LANGUAGE,
      );
    });

    it("usa language do input no find local, search TMDB e resolver", async () => {
      const hit = MovieCatalogLookupFixtures.searchHit();
      const details = MovieCatalogLookupFixtures.details({
        title: "Interstellar",
      });
      vi.mocked(catalog.searchMovies).mockResolvedValue(
        MovieCatalogLookupFixtures.searchPage([hit]),
      );
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(details);

      await service.findDetailsByTitle({
        query: "Interstellar",
        language: "en-US",
      });

      expect(repository.findByTitleAndYear).toHaveBeenCalledWith(
        "Interstellar",
        undefined,
        "en-US",
      );
      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "Interstellar",
        1,
        undefined,
        "en-US",
      );
      expect(resolver.resolveByTmdbId).toHaveBeenCalledWith(hit.id, "en-US");
    });
  });
});
