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
  tmdbId: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  imdbId: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().min(1).optional(),
  ),
  posterPath: z.string().nullable().optional(),
}).transform((movie) => {
  const result = { ...movie };
  if (result.tmdbId === undefined) {
    delete result.tmdbId;
  }
  if (result.imdbId === undefined) {
    delete result.imdbId;
  }
  return result;
});

export type SingleMovieReccomendationEntity = z.infer<
  typeof SingleMovieReccomendationSchema
>;

export const MultipleMoviesRecommendationsSchema = z.array(
  SingleMovieReccomendationSchema
);

export type MovieRecommendationEntity = z.infer<
  typeof MultipleMoviesRecommendationsSchema
>;
