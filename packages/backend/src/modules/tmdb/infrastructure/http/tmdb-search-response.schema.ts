import z from "zod";

const TmdbSearchMovieResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string(),
  poster_path: z.string().nullable(),
  release_date: z.string(),
});

export const TmdbSearchResponseSchema = z.object({
  page: z.number(),
  results: z.array(TmdbSearchMovieResultSchema),
});

export type TmdbSearchResponse = z.infer<typeof TmdbSearchResponseSchema>;
