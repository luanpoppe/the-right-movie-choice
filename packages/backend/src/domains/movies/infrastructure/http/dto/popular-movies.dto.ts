import z from "zod";
import { MovieCatalogSearchConstants } from "@/domains/movies/domain/movie-catalog-search.constants";

export const PopularMoviesQuerySchema = z
  .object({
    language: z.enum(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).optional(),
  })
  .strict();

export type PopularMoviesQuery = z.infer<typeof PopularMoviesQuerySchema>;

export const PopularMovieResponseSchema = z.object({
  tmdbId: z.number(),
  title: z.string(),
  year: z.number().nullable(),
  posterPath: z.string().url().nullable(),
  overview: z.string(),
  runtimeMinutes: z.number().nullable(),
  voteAverage: z.number().nullable(),
  directors: z.array(z.string()),
});

export type PopularMovieResponseDTO = z.infer<
  typeof PopularMovieResponseSchema
>;

export const PopularMoviesResponseSchema = z.object({
  movies: z.array(PopularMovieResponseSchema),
});

export type PopularMoviesResponseDTO = z.infer<
  typeof PopularMoviesResponseSchema
>;
