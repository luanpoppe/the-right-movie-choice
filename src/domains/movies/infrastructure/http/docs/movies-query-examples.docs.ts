import z from "zod";
import { WrongMovieSchemaFromLlmException } from "@/domains/movies/domain/exceptions/wrong-movie-schema-from-llm.exception";
import { RouteShorthandOptions } from "fastify";
import { MoviesQueryExamplesResponseDTOSchema } from "../dto/movies-query-examples.dto";

export const MoviesQueryExamplesDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description: "Get creative query examples to search for movies",
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
