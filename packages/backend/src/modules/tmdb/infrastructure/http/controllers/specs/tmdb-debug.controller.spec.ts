import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import type { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieSearchPage } from "@/domains/movies/domain/entities/movie-search.entity";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
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
  id: 11,
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
}): FastifyRequest {
  return { query: query ?? {} } as FastifyRequest;
}

function createMovieRequest(id: string): FastifyRequest {
  return { params: { id } } as FastifyRequest;
}

describe("TmdbDebugController", () => {
  let catalog: IMovieCatalogProvider;
  let cache: TmdbMovieDetailsCache;
  let controller: TmdbDebugController;

  beforeEach(() => {
    catalog = {
      searchMovies: vi.fn(),
      getMovieDetails: vi.fn(),
    };
    cache = {
      get: vi.fn(),
      set: vi.fn(),
    } as unknown as TmdbMovieDetailsCache;
    controller = new TmdbDebugController(catalog, cache);
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
    });

    it("returns catalog search page with optional page", async () => {
      vi.mocked(catalog.searchMovies).mockResolvedValue(SEARCH_PAGE);
      const reply = createReply();

      await controller.search(
        createSearchRequest({ query: "star", page: "2" }),
        reply,
      );

      expect(catalog.searchMovies).toHaveBeenCalledWith("star", 2);
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
      expect(cache.get).not.toHaveBeenCalled();
    });

    it("returns cached details without calling catalog or set", async () => {
      vi.mocked(cache.get).mockResolvedValue(DETAILS);
      const reply = createReply();

      await controller.getMovie(createMovieRequest("11"), reply);

      expect(cache.get).toHaveBeenCalledWith(11);
      expect(catalog.getMovieDetails).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(DETAILS);
    });

    it("fetches details on cache miss and writes cache without refreshing TTL on later hits", async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(catalog.getMovieDetails).mockResolvedValue(DETAILS);
      vi.mocked(cache.set).mockResolvedValue(undefined);
      const reply = createReply();

      await controller.getMovie(createMovieRequest("11"), reply);

      expect(catalog.getMovieDetails).toHaveBeenCalledWith(11);
      expect(cache.set).toHaveBeenCalledWith(11, DETAILS);
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith(DETAILS);
    });
  });
});
