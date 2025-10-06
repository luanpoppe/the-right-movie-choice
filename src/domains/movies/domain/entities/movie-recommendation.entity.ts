import z from "zod";

export const SingleMovieReccomendationSchema = z.object({
  title: z.string().nonempty(),
  director: z.string().nonempty(),
  actors: z.array(z.string()),
  releaseYear: z.coerce.number(),
  streamingPlatform: z.string(),
  imdbRating: z.coerce.number().describe("Nota do filme no IMDb"),
  synopsis: z.string().describe("Breve sinopse do filme"),
  whySuggestion: z
    .string()
    .describe("Breve motivo pelo qual o filme é uma boa sugestão"),
  durationInMinutes: z.coerce.number().describe("Duração do filme em minutos"),
});

export const MovieRecommendationSchema = z.object({
  movies: z.array(SingleMovieReccomendationSchema),
});

export type MovieRecommendationEntity = z.infer<
  typeof MovieRecommendationSchema
>;
