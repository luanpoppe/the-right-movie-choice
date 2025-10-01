import { FastifyInstance } from "fastify";
import { movieRecommendationController } from "./movie-recommendation.controller";
import {
  MovieRecommendationRequestDTOSchema,
  MovieRecommendationResponseDTOSchema,
} from "../dto/movie-recommendation.dto";
import { HeadersDTOSchema } from "@/infrastructure/http/dto/headers.dto";
import z from "zod";
import { WrongMovieSchemaFromLlmException } from "@/domains/movies/domain/exceptions/wrong-movie-schema-from-llm.exception";

export function moviesControllers(app: FastifyInstance) {
  app.post(
    "/movie/recommendation",
    {
      schema: {
        body: MovieRecommendationRequestDTOSchema,
        headers: HeadersDTOSchema,
        response: {
          200: MovieRecommendationResponseDTOSchema,
          400: z.object({ error: z.string() }),
          500: z.object({
            error: z.literal(new WrongMovieSchemaFromLlmException().message),
          }),
        },
      },
    },
    movieRecommendationController
  );
}
