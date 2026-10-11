import { beforeEach, describe, expect, it, vi } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import { Logger } from "@/lib/logger/logger";
import type { DiscoverCatalogMoviesUseCase } from "@/domains/movies/application/use-cases/discover-catalog-movies.use-case";
import type { SearchCatalogKeywordsUseCase } from "@/domains/movies/application/use-cases/search-catalog-keywords.use-case";
import type { SearchCatalogMoviesUseCase } from "@/domains/movies/application/use-cases/search-catalog-movies.use-case";
import type { SearchCatalogPeopleUseCase } from "@/domains/movies/application/use-cases/search-catalog-people.use-case";
import { MovieCatalogSearchValidationException } from "@/domains/movies/domain/movie-catalog-search.constants";
import { MovieCatalogSearchController } from "../movie-catalog-search.controller";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function createReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

function createRequest(query: unknown): FastifyRequest {
  return { query } as FastifyRequest;
}

const SEARCH_PAGE = {
  page: 1,
  results: [
    { id: 1, title: "Interstellar", year: 2014, posterPath: null, overview: "" },
  ],
};

describe("MovieCatalogSearchController", () => {
  let searchCatalogMoviesUseCase: SearchCatalogMoviesUseCase;
  let searchCatalogPeopleUseCase: SearchCatalogPeopleUseCase;
  let searchCatalogKeywordsUseCase: SearchCatalogKeywordsUseCase;
  let discoverCatalogMoviesUseCase: DiscoverCatalogMoviesUseCase;
  let handlers: ReturnType<typeof MovieCatalogSearchController.create>;

  beforeEach(() => {
    vi.clearAllMocks();

    searchCatalogMoviesUseCase = {
      execute: vi.fn(),
    } as unknown as SearchCatalogMoviesUseCase;
    searchCatalogPeopleUseCase = {
      execute: vi.fn(),
    } as unknown as SearchCatalogPeopleUseCase;
    searchCatalogKeywordsUseCase = {
      execute: vi.fn(),
    } as unknown as SearchCatalogKeywordsUseCase;
    discoverCatalogMoviesUseCase = {
      execute: vi.fn(),
    } as unknown as DiscoverCatalogMoviesUseCase;

    handlers = MovieCatalogSearchController.create({
      searchCatalogMoviesUseCase,
      searchCatalogPeopleUseCase,
      searchCatalogKeywordsUseCase,
      discoverCatalogMoviesUseCase,
    });
  });

  describe("search", () => {
    it("REQ-1: responde 200 com a página e repassa os campos convertidos", async () => {
      vi.mocked(searchCatalogMoviesUseCase.execute).mockResolvedValue(
        SEARCH_PAGE,
      );
      const reply = createReply();

      await handlers.search(
        createRequest({
          query: "Interstellar",
          year: "2014",
          page: "1",
          language: "pt-BR",
        }),
        reply,
      );

      expect(searchCatalogMoviesUseCase.execute).toHaveBeenCalledWith({
        query: "Interstellar",
        year: 2014,
        page: 1,
        language: "pt-BR",
      });
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(SEARCH_PAGE);
    });

    it("REQ-1: converte posterPath relativo em URL absoluta", async () => {
      vi.mocked(searchCatalogMoviesUseCase.execute).mockResolvedValue({
        page: 1,
        results: [
          {
            id: 2,
            title: "Finding Nemo",
            year: 2003,
            posterPath: "/nemo.jpg",
            overview: "",
          },
        ],
      });
      const reply = createReply();

      await handlers.search(createRequest({ query: "Nemo" }), reply);

      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({
        page: 1,
        results: [
          {
            id: 2,
            title: "Finding Nemo",
            year: 2003,
            posterPath: "https://image.tmdb.org/t/p/w500/nemo.jpg",
            overview: "",
          },
        ],
      });
    });

    it("REQ-2: query ausente vai como input vazio ao use case", async () => {
      vi.mocked(searchCatalogMoviesUseCase.execute).mockResolvedValue({
        page: 1,
        results: [],
      });
      const reply = createReply();

      await handlers.search(createRequest({}), reply);

      expect(searchCatalogMoviesUseCase.execute).toHaveBeenCalledWith({});
      expect(reply.status).toHaveBeenCalledWith(200);
    });

    it("REQ-5: página inválida responde 400 sem executar o use case", async () => {
      const reply = createReply();

      await expect(
        handlers.search(createRequest({ page: "abc" }), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(searchCatalogMoviesUseCase.execute).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });

    it("REQ-5: idioma inválido responde 400 sem executar o use case", async () => {
      const reply = createReply();

      await expect(
        handlers.search(createRequest({ language: "fr-FR" }), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(searchCatalogMoviesUseCase.execute).not.toHaveBeenCalled();
    });

    it("REQ-5: ano não inteiro positivo responde 400", async () => {
      const reply = createReply();

      await expect(
        handlers.search(createRequest({ year: "2014.5" }), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(searchCatalogMoviesUseCase.execute).not.toHaveBeenCalled();
    });

    it("REQ-6: erro do use case sobe pelo handler", async () => {
      vi.mocked(searchCatalogMoviesUseCase.execute).mockRejectedValue(
        new Error("TMDB upstream unavailable"),
      );
      const reply = createReply();

      await expect(
        handlers.search(createRequest({ query: "Interstellar" }), reply),
      ).rejects.toThrow("TMDB upstream unavailable");

      expect(reply.status).not.toHaveBeenCalled();
    });
  });

  describe("people", () => {
    it("REQ-7: responde 200 com os candidatos", async () => {
      const peoplePage = { page: 1, results: [] };
      vi.mocked(searchCatalogPeopleUseCase.execute).mockResolvedValue(peoplePage);
      const reply = createReply();

      await handlers.people(
        createRequest({ query: "Nolan", page: "2" }),
        reply,
      );

      expect(searchCatalogPeopleUseCase.execute).toHaveBeenCalledWith({
        query: "Nolan",
        page: 2,
      });
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(peoplePage);
    });

    it("REQ-7 erro: query ausente responde 400 sem executar", async () => {
      const reply = createReply();

      await expect(
        handlers.people(createRequest({}), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(searchCatalogPeopleUseCase.execute).not.toHaveBeenCalled();
    });

    it("REQ-7 erro: query só com espaços responde 400", async () => {
      const reply = createReply();

      await expect(
        handlers.people(createRequest({ query: "   " }), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(searchCatalogPeopleUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("keywords", () => {
    it("REQ-7: responde 200 com os termos", async () => {
      const keywordsPage = { page: 1, results: [{ id: 4379, name: "time travel" }] };
      vi.mocked(searchCatalogKeywordsUseCase.execute).mockResolvedValue(
        keywordsPage,
      );
      const reply = createReply();

      await handlers.keywords(createRequest({ query: "time travel" }), reply);

      expect(searchCatalogKeywordsUseCase.execute).toHaveBeenCalledWith({
        query: "time travel",
      });
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(keywordsPage);
    });

    it("REQ-7 erro: query ausente responde 400 sem executar", async () => {
      const reply = createReply();

      await expect(
        handlers.keywords(createRequest({}), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(searchCatalogKeywordsUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("discover", () => {
    it("REQ-3: converte a lista em vírgula e repassa os filtros", async () => {
      vi.mocked(discoverCatalogMoviesUseCase.execute).mockResolvedValue({
        page: 2,
        results: [],
      });
      const reply = createReply();

      await handlers.discover(
        createRequest({
          genres: "28,35",
          minRating: "7",
          yearFrom: "2010",
          yearTo: "2015",
          page: "2",
          language: "pt-BR",
        }),
        reply,
      );

      expect(discoverCatalogMoviesUseCase.execute).toHaveBeenCalledWith({
        genres: [28, 35],
        minRating: 7,
        yearFrom: 2010,
        yearTo: 2015,
        page: 2,
        language: "pt-BR",
      });
      expect(reply.status).toHaveBeenCalledWith(200);
    });

    it("REQ-8: repassa elenco, direção, palavra-chave, duração e certificação", async () => {
      vi.mocked(discoverCatalogMoviesUseCase.execute).mockResolvedValue({
        page: 1,
        results: [],
      });
      const reply = createReply();

      await handlers.discover(
        createRequest({
          cast: "234352,6193",
          director: "525",
          keyword: "4379",
          runtimeFrom: "90",
          runtimeTo: "140",
          certificationCountry: "BR",
          certification: "14",
        }),
        reply,
      );

      expect(discoverCatalogMoviesUseCase.execute).toHaveBeenCalledWith({
        cast: [234352, 6193],
        director: [525],
        keyword: [4379],
        runtimeFrom: 90,
        runtimeTo: 140,
        certificationCountry: "BR",
        certification: "14",
      });
    });

    it("REQ-4: discover sem filtros passa input vazio", async () => {
      vi.mocked(discoverCatalogMoviesUseCase.execute).mockResolvedValue({
        page: 1,
        results: [],
      });
      const reply = createReply();

      await handlers.discover(createRequest({ page: "1" }), reply);

      expect(discoverCatalogMoviesUseCase.execute).toHaveBeenCalledWith({
        page: 1,
      });
    });

    it("REQ-5: id de lista inválido responde 400 sem executar", async () => {
      const reply = createReply();

      await expect(
        handlers.discover(createRequest({ genres: "28,abc" }), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(discoverCatalogMoviesUseCase.execute).not.toHaveBeenCalled();
    });

    it("REQ-5: idioma inválido no discover responde 400", async () => {
      const reply = createReply();

      await expect(
        handlers.discover(createRequest({ language: "fr-FR" }), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(discoverCatalogMoviesUseCase.execute).not.toHaveBeenCalled();
    });

    it("REQ-5: página zero no discover responde 400", async () => {
      const reply = createReply();

      await expect(
        handlers.discover(createRequest({ page: "0" }), reply),
      ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

      expect(discoverCatalogMoviesUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
