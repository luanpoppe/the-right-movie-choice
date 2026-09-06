import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import {
  UserMovieEntryGetResponseDTOSchema,
  UserMovieEntryListQueryDTOSchema,
  UserMovieEntryListResponseDTOSchema,
  UserMovieEntryPatchDTOSchema,
  UserMovieEntryPatchResponseDTOSchema,
  UserMovieEntryTmdbIdParamsSchema,
} from "../dto/user-movie-entry.dto";

const badRequestResponseSchema = z
  .object({ error: z.string().or(z.array(z.any())) })
  .describe("Bad Request");

const unauthorizedResponseSchema = z
  .object({
    error: z.enum([new InvalidAccessTokenException().message]),
  })
  .describe("Unauthorized");

const notFoundResponseSchema = z
  .object({ error: z.string() })
  .describe("Not Found");

export const UserMovieEntryListDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "List the authenticated user's movie entries with optional watched, favorite, or inWatchlist filters",
    querystring: UserMovieEntryListQueryDTOSchema,
    response: {
      200: UserMovieEntryListResponseDTOSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
    },
  },
};

export const UserMovieEntryGetDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description: "Get a single movie entry for the authenticated user by TMDB id",
    params: UserMovieEntryTmdbIdParamsSchema,
    response: {
      200: UserMovieEntryGetResponseDTOSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const UserMovieEntryPatchDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Partially update watched, favorite, inWatchlist, rating, or watchedAt for a movie entry",
    params: UserMovieEntryTmdbIdParamsSchema,
    body: UserMovieEntryPatchDTOSchema,
    response: {
      200: UserMovieEntryPatchResponseDTOSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
    },
  },
};
