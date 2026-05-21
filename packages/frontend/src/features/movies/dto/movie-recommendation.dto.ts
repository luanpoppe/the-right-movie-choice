import z from "zod";
import { SingleMovieReccomendationSchema } from "../entities/movie-recommendation.entity";

export const MovieRecommendationResponseDTOSchema = z.object({
  movies: z.array(SingleMovieReccomendationSchema),
  response: z.string(),
});

export type MovieRecommendationResponseDTO = z.infer<
  typeof MovieRecommendationResponseDTOSchema
>;

export const MovieRecommendationRequestDTOSchema = z.object({
  userMessage: z.string().nonempty(),
});

export type MovieRecommendationRequestDTO = z.infer<
  typeof MovieRecommendationRequestDTOSchema
>;
