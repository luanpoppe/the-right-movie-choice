import z from "zod";
import { WrongMovieSchemaFromLlmException } from "@/domains/movies/domain/exceptions/wrong-movie-schema-from-llm.exception";
import { RouteShorthandOptions } from "fastify";
import { MoviesQueryExamplesResponseDTOSchema } from "../dto/movies-query-examples.dto";

export const MoviesQueryExamplesDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Get 3 query examples for the landing. Serves 3 random texts from the persisted suggestion pool when count >= 3; falls back to AI generation otherwise. Public, no auth.",
    response: {
      200: MoviesQueryExamplesResponseDTOSchema.describe("Success"),
      500: z
        .object({
          error: z.enum([
            new WrongMovieSchemaFromLlmException().message,
            "Unkown Error",
          ]),
        })
        .describe("Internal Server Error"),
    },
  },
};
