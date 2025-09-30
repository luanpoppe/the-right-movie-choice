import z from "zod";
import { MovieRecommendationSchema } from "../../entities/movie-recommendation-llm-response.entity";

export const MovieRecommendationRequestDtoSchema = z.object({
  userMessage: z.string().nonempty(),
});

export type MovieRecommendationResponseDto = {
  movies: z.infer<typeof MovieRecommendationSchema>;
  response: string;
};
