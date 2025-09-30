import z from "zod";

export const MovieRecommendationLLMResponseDto = z.object({
  movies: z.array(
    z.object({
      title: z.string().nonempty(),
      director: z.string().nonempty(),
      actors: z.array(z.string()),
      releaseYear: z.coerce.number(),
      streamingPlatform: z.string(),
      imdbRating: z.coerce.number().describe("Nota do filme no IMDb"),
      description: z.string().describe("Breve descrição do filme"),
      durationInMinutes: z.coerce
        .number()
        .describe("Duração do filme em minutos"),
    })
  ),
});
