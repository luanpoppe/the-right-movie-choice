import { RouteShorthandOptions } from "fastify";
import z from "zod";
import {
  MovieCatalogDiscoverQuerySchema,
  MovieCatalogKeywordsQuerySchema,
  MovieCatalogPeopleQuerySchema,
  MovieCatalogSearchQuerySchema,
  MovieKeywordSearchPageResponseSchema,
  MoviePersonSearchPageResponseSchema,
  MovieSearchPageResponseSchema,
} from "../dto/movie-catalog-search.dto";

const badRequestResponseSchema = z
  .object({ error: z.string().or(z.array(z.any())) })
  .describe("Bad Request");

const tmdbErrorResponseSchema = z
  .object({ error: z.string() })
  .describe("Bad Gateway");

export const MovieCatalogSearchDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Search movies in the TMDB catalog by text or list popular ones. Public, no auth.",
    querystring: MovieCatalogSearchQuerySchema,
    response: {
      200: MovieSearchPageResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      502: tmdbErrorResponseSchema,
      503: tmdbErrorResponseSchema,
      504: tmdbErrorResponseSchema,
    },
  },
};

export const MovieCatalogPeopleDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Search TMDB people by name to pick a candidate id. Public, no auth.",
    querystring: MovieCatalogPeopleQuerySchema,
    response: {
      200: MoviePersonSearchPageResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      502: tmdbErrorResponseSchema,
      503: tmdbErrorResponseSchema,
      504: tmdbErrorResponseSchema,
    },
  },
};

export const MovieCatalogKeywordsDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Search TMDB keywords by term to pick a candidate id. Public, no auth.",
    querystring: MovieCatalogKeywordsQuerySchema,
    response: {
      200: MovieKeywordSearchPageResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      502: tmdbErrorResponseSchema,
      503: tmdbErrorResponseSchema,
      504: tmdbErrorResponseSchema,
    },
  },
};

export const MovieCatalogDiscoverDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Discover movies in the TMDB catalog by genre, cast, director, keyword, rating, year, runtime, or certification. Public, no auth.",
    querystring: MovieCatalogDiscoverQuerySchema,
    response: {
      200: MovieSearchPageResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      502: tmdbErrorResponseSchema,
      503: tmdbErrorResponseSchema,
      504: tmdbErrorResponseSchema,
    },
  },
};
