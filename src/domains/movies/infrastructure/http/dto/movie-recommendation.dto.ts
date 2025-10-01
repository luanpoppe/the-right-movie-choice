import z from "zod";
import { SingleMovieReccomendationSchema } from "../../../domain/entities/movie-recommendation.entity";

export const MovieRecommendationRequestDtoSchema = z.object({
  userMessage: z.string().nonempty(),
});

export type MovieRecommendationResponseDTO = {
  movies: z.infer<typeof SingleMovieReccomendationSchema>[];
  response: string;
};
