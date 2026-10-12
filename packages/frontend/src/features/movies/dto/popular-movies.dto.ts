import z from "zod";

export const PopularMovieSchema = z.object({
  tmdbId: z.number(),
  title: z.string(),
  year: z.number().nullable(),
  posterPath: z.string().url().nullable(),
  overview: z.string(),
  runtimeMinutes: z.number().nullable(),
  voteAverage: z.number().nullable(),
  directors: z.array(z.string()),
});

export type PopularMovie = z.infer<typeof PopularMovieSchema>;

export const PopularMoviesResponseSchema = z.object({
  movies: z.array(PopularMovieSchema),
});

export type PopularMoviesResponse = z.infer<typeof PopularMoviesResponseSchema>;
