import z from "zod";

export const MovieRecommendationRequestDto = z.object({
  userMessage: z.string().nonempty(),
});
