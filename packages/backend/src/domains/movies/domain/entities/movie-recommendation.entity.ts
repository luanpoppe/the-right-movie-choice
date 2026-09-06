import z from "zod";

const singleMovieRecommendationFields = {
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
};

/** Schema para structured output do LLM — sem transform/preprocess (compatível com JSON Schema). */
export const SingleMovieReccomendationLlmSchema = z.object({
  ...singleMovieRecommendationFields,
  tmdbId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("ID TMDB quando resolvido via lookupMovies"),
  imdbId: z
    .string()
    .min(1)
    .optional()
    .describe("ID IMDb quando disponível no catálogo"),
});

export const MovieRecommendationLlmSchema = z.object({
  movies: z.array(SingleMovieReccomendationLlmSchema).min(0).max(3),
  response: z.string().nonempty(),
});

function omitUnsetCatalogIds<
  T extends { tmdbId?: number | undefined; imdbId?: string | undefined },
>(movie: T): T {
  const result = { ...movie };
  if (result.tmdbId === undefined) {
    delete result.tmdbId;
  }
  if (result.imdbId === undefined) {
    delete result.imdbId;
  }
  return result;
}

export const SingleMovieReccomendationInternalSchema = z
  .object({
    ...singleMovieRecommendationFields,
    tmdbId: z.preprocess(
      (value) => (value === null ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),
    imdbId: z.preprocess(
      (value) => (value === null ? undefined : value),
      z.string().min(1).optional(),
    ),
  })
  .transform(omitUnsetCatalogIds);

export const SingleMovieReccomendationSchema =
  SingleMovieReccomendationInternalSchema;

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
