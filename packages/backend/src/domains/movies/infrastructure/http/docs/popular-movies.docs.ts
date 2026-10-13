import { RouteShorthandOptions } from "fastify";
import z from "zod";
import {
  PopularMoviesQuerySchema,
  PopularMoviesResponseSchema,
} from "../dto/popular-movies.dto";

const badRequestResponseSchema = z
  .object({ error: z.string().or(z.array(z.any())) })
  .describe("Bad Request");

export const PopularMoviesDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "List the daily popular movies, refreshed by a scheduled job. Public, no auth.",
    querystring: PopularMoviesQuerySchema,
    response: {
      200: PopularMoviesResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
    },
  },
};
