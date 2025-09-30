import z from "zod";
import { MovieRecommendationLLMResponseDto } from "./movie-recommendation-llm-response.dto";

export const MovieRecommendationRequestDtoSchema = z.object({
  userMessage: z.string().nonempty(),
});

export type MovieRecommendationResponseDto = {
  movies: z.infer<typeof MovieRecommendationLLMResponseDto>;
  response: string;
};
