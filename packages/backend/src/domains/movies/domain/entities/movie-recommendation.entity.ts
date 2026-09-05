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

export const SingleMovieReccomendationInternalSchema =
  SingleMovieReccomendationSchema.extend({
    tmdbId: z.number().optional(),
    imdbId: z.string().optional(),
  });

export const MovieRecommendationSchema = z.object({
  movies: z.array(SingleMovieReccomendationInternalSchema).min(0).max(3),
  response: z.string().nonempty(),
});

export type SingleMovieReccomendationEntity = z.infer<
  typeof SingleMovieReccomendationSchema
>;

export type SingleMovieReccomendationInternalEntity = z.infer<
  typeof SingleMovieReccomendationInternalSchema
>;

export type MovieRecommendationEntity = z.infer<
  typeof MovieRecommendationSchema
>;
