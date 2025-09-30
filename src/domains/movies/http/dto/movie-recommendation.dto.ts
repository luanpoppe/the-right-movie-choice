import z from "zod";
import { MovieRecommendationLLMResponseDto } from "./movie-recommendation-llm-response.dto";

export const MovieRecommendationRequestDtoSchema = z.object({
  userMessage: z.string().nonempty(),
});

export type MovieRecommendationResponseDto = {
  response: z.infer<typeof MovieRecommendationLLMResponseDto>;
};
