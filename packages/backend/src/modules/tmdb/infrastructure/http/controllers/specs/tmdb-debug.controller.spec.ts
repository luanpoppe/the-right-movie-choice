import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import type { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieSearchPage } from "@/domains/movies/domain/entities/movie-search.entity";
import type { MovieCatalogDetailsResolver } from "@/domains/movies/infrastructure/providers/movie-catalog-details.resolver";
import {
  TmdbDebugController,
  TmdbDebugInvalidMovieIdException,
  TmdbDebugQueryRequiredException,
} from "@/modules/tmdb/infrastructure/http/controllers/tmdb-debug.controller";

const SEARCH_PAGE: MovieSearchPage = {
  page: 1,
  results: [
    {
      id: 11,
      title: "Star Wars",
      year: 1977,
      posterPath: null,
      overview: "",
    },
  ],
};

const DETAILS: MovieCatalogDetails = {
  tmdbId: 11,
  title: "Star Wars",
  year: 1977,
  posterPath: null,
  overview: "",
  runtimeMinutes: 121,
  genres: [],
  tmdbVoteAverage: null,
  originCountries: [],
  directors: [],
  cast: [],
  watchProviders: { flatrate: [], rent: [], buy: [] },
  imdbId: null,
};

function createReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

function createSearchRequest(query?: {
  query?: string;
  page?: string;
  language?: string;
}): FastifyRequest {
  return { query: query ?? {} } as FastifyRequest;
}

function createMovieRequest(
  id: string,
  query?: { language?: string },
): FastifyRequest {
  return { params: { id }, query: query ?? {} } as FastifyRequest;
}

describe("TmdbDebugController", () => {
  let catalog: IMovieCatalogProvider;
  let resolver: MovieCatalogDetailsResolver;
  let controller: TmdbDebugController;

  beforeEach(() => {
    catalog = {
      searchMovies: vi.fn(),
      getMovieDetails: vi.fn(),
    };
    resolver = {
      resolveByTmdbId: vi.fn(),
    } as unknown as MovieCatalogDetailsResolver;
    controller = new TmdbDebugController(catalog, resolver);
  });

  describe("search", () => {
    it("throws TmdbDebugQueryRequiredException 400 when query is missing", async () => {
      const reply = createReply();

      await expect(
        controller.search(createSearchRequest(), reply),
      ).rejects.toMatchObject({
        constructor: TmdbDebugQueryRequiredException,
        statusCode: 400,
      });
      expect(catalog.searchMovies).not.toHaveBeenCalled();
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
    });

    it("throws TmdbDebugQueryRequiredException 400 when query is empty", async () => {
      const reply = createReply();

      await expect(
        controller.search(createSearchRequest({ query: "" }), reply),
      ).rejects.toMatchObject({
        constructor: TmdbDebugQueryRequiredException,
        statusCode: 400,
      });
      expect(catalog.searchMovies).not.toHaveBeenCalled();
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
    });

    it("returns catalog search page with optional page", async () => {
      vi.mocked(catalog.searchMovies).mockResolvedValue(SEARCH_PAGE);
      const reply = createReply();

      await controller.search(
        createSearchRequest({ query: "star", page: "2" }),
        reply,
      );

      expect(catalog.searchMovies).toHaveBeenCalledWith("star", 2);
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(SEARCH_PAGE);
    });

    it("REQ-6: search usa só IMovieCatalogProvider.searchMovies, sem resolver nem Postgres", async () => {
      vi.mocked(catalog.searchMovies).mockResolvedValue(SEARCH_PAGE);
      const reply = createReply();

      await controller.search(createSearchRequest({ query: "star" }), reply);

      expect(catalog.searchMovies).toHaveBeenCalledWith("star", undefined);
      expect(catalog.getMovieDetails).not.toHaveBeenCalled();
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(SEARCH_PAGE);
    });

    it("passes language to searchMovies when query language is set", async () => {
      vi.mocked(catalog.searchMovies).mockResolvedValue(SEARCH_PAGE);
      const reply = createReply();

      await controller.search(
        createSearchRequest({ query: "star", page: "2", language: "en-US" }),
        reply,
      );

      expect(catalog.searchMovies).toHaveBeenCalledWith(
        "star",
        2,
        undefined,
        "en-US",
      );
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(SEARCH_PAGE);
    });
  });

  describe("getMovie", () => {
    it("throws TmdbDebugInvalidMovieIdException 400 when id is not an integer", async () => {
      const reply = createReply();

      await expect(
        controller.getMovie(createMovieRequest("abc"), reply),
      ).rejects.toMatchObject({
        constructor: TmdbDebugInvalidMovieIdException,
        statusCode: 400,
      });
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
    });

    it("REQ-3: throws TmdbDebugInvalidMovieIdException 400 quando id é decimal", async () => {
      const reply = createReply();

      await expect(
        controller.getMovie(createMovieRequest("157336.5"), reply),
      ).rejects.toMatchObject({
        constructor: TmdbDebugInvalidMovieIdException,
        statusCode: 400,
      });
      expect(resolver.resolveByTmdbId).not.toHaveBeenCalled();
    });

    it("REQ-3: returns resolver details for valid movie id via local-first pipeline", async () => {
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(DETAILS);
      const reply = createReply();

      await controller.getMovie(createMovieRequest("157336"), reply);

      expect(resolver.resolveByTmdbId).toHaveBeenCalledWith(157336);
      expect(catalog.getMovieDetails).not.toHaveBeenCalled();
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(DETAILS);
    });

    it("passes language to resolveByTmdbId when query language is set", async () => {
      vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(DETAILS);
      const reply = createReply();

      await controller.getMovie(
        createMovieRequest("11", { language: "en-US" }),
        reply,
      );

      expect(resolver.resolveByTmdbId).toHaveBeenCalledWith(11, "en-US");
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(DETAILS);
    });
  });
});
