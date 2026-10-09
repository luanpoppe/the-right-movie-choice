import z from "zod";
import { MovieCatalogSearchConstants } from "@/domains/movies/domain/movie-catalog-search.constants";

export const MovieCatalogSearchQuerySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  year: z.coerce.number().int().positive().optional(),
  language: z.enum(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).optional(),
});

export type MovieCatalogSearchQuery = z.infer<
  typeof MovieCatalogSearchQuerySchema
>;

export const MovieCatalogPeopleQuerySchema = z.object({
  query: z.string().trim().min(1),
  page: z.coerce.number().int().min(1).optional(),
  language: z.enum(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).optional(),
});

export type MovieCatalogPeopleQuery = z.infer<
  typeof MovieCatalogPeopleQuerySchema
>;

export const MovieCatalogKeywordsQuerySchema = z.object({
  query: z.string().trim().min(1),
  page: z.coerce.number().int().min(1).optional(),
});

export type MovieCatalogKeywordsQuery = z.infer<
  typeof MovieCatalogKeywordsQuerySchema
>;

export const MovieSearchHitResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number().nullable(),
  posterPath: z.string().nullable(),
  overview: z.string(),
});

export const MovieSearchPageResponseSchema = z.object({
  page: z.number(),
  results: z.array(MovieSearchHitResponseSchema),
});

export type MovieSearchPageResponseDTO = z.infer<
  typeof MovieSearchPageResponseSchema
>;

export const MoviePersonKnownForResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
});

export const MoviePersonSearchHitResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  knownForDepartment: z.string().nullable(),
  knownFor: z.array(MoviePersonKnownForResponseSchema),
});

export const MoviePersonSearchPageResponseSchema = z.object({
  page: z.number(),
  results: z.array(MoviePersonSearchHitResponseSchema),
});

export type MoviePersonSearchPageResponseDTO = z.infer<
  typeof MoviePersonSearchPageResponseSchema
>;

export const MovieKeywordSearchHitResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const MovieKeywordSearchPageResponseSchema = z.object({
  page: z.number(),
  results: z.array(MovieKeywordSearchHitResponseSchema),
});

export type MovieKeywordSearchPageResponseDTO = z.infer<
  typeof MovieKeywordSearchPageResponseSchema
>;
