import z from "zod";
import { SingleMovieReccomendationSchema } from "../../../domain/entities/movie-recommendation.entity";

export const MovieRecommendationRequestDTOSchema = z.object({
  userMessage: z.string().nonempty(),
});

export type MovieRecommendationRequest = z.infer<
  typeof MovieRecommendationRequestDTOSchema
>;

export const MovieRecommendationResponseDTOSchema = z.object({
  movies: z.array(SingleMovieReccomendationSchema),
  response: z.string(),
});

export type MovieRecommendationResponseDTO = z.infer<
  typeof MovieRecommendationResponseDTOSchema
>;
