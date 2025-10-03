import { HeadersDTOSchema } from "@/infrastructure/http/dto/headers.dto";
import {
  MovieRecommendationRequestDTOSchema,
  MovieRecommendationResponseDTOSchema,
} from "../dto/movie-recommendation.dto";
import z from "zod";
import { WrongMovieSchemaFromLlmException } from "@/domains/movies/domain/exceptions/wrong-movie-schema-from-llm.exception";
import { RouteShorthandOptions } from "fastify";

export const MovieRecommendationDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    body: MovieRecommendationRequestDTOSchema,
    description: "Get movie recommendations based on the user message",
    headers: HeadersDTOSchema,
    response: {
      200: MovieRecommendationResponseDTOSchema.describe("Success"),
      400: z.object({ error: z.string() }).describe("Bad Request"),
      500: z
        .object({
          error: z.enum([
            new WrongMovieSchemaFromLlmException().message,
            "Unkown Error",
          ]),
        })
        .describe("Internal server error"),
    },
  },
};
