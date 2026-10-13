import z from "zod";
import { MovieCatalogSearchConstants } from "@/domains/movies/domain/movie-catalog-search.constants";

export const MovieCatalogSearchQuerySchema = z
  .object({
    query: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    year: z.coerce.number().int().positive().optional(),
    language: z.enum(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).optional(),
  })
  .strict();

export type MovieCatalogSearchQuery = z.infer<
  typeof MovieCatalogSearchQuerySchema
>;

export const MovieCatalogPeopleQuerySchema = z
  .object({
    query: z.string().trim().min(1),
    page: z.coerce.number().int().min(1).optional(),
    language: z.enum(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).optional(),
  })
  .strict();

export type MovieCatalogPeopleQuery = z.infer<
  typeof MovieCatalogPeopleQuerySchema
>;

export const MovieCatalogKeywordsQuerySchema = z
  .object({
    query: z.string().trim().min(1),
    page: z.coerce.number().int().min(1).optional(),
  })
  .strict();

export type MovieCatalogKeywordsQuery = z.infer<
  typeof MovieCatalogKeywordsQuerySchema
>;

const commaSeparatedPositiveIdListSchema = z
  .union([z.string(), z.array(z.union([z.string(), z.number()]))])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) {
      return undefined;
    }

    const rawItems = typeof value === "string" ? value.split(",") : value;
    const ids: number[] = [];

    for (const rawItem of rawItems) {
      const trimmedItem = String(rawItem).trim();
      if (trimmedItem === "") {
        continue;
      }

      const id = Number(trimmedItem);
      const isPositiveInteger = Number.isInteger(id) && id > 0;
      if (!isPositiveInteger) {
        ctx.addIssue({
          code: "custom",
          message: `Each id must be a positive integer, received "${trimmedItem}"`,
        });
        return z.NEVER;
      }

      ids.push(id);
    }

    const isEmptyList = ids.length === 0;
    if (isEmptyList) {
      return undefined;
    }

    return ids;
  });

export const MovieCatalogDiscoverQuerySchema = z
  .object({
    genres: commaSeparatedPositiveIdListSchema,
    cast: commaSeparatedPositiveIdListSchema,
    director: commaSeparatedPositiveIdListSchema,
    keyword: commaSeparatedPositiveIdListSchema,
    minRating: z.coerce.number().optional(),
    yearFrom: z.coerce.number().int().positive().optional(),
    yearTo: z.coerce.number().int().positive().optional(),
    runtimeFrom: z.coerce.number().int().positive().optional(),
    runtimeTo: z.coerce.number().int().positive().optional(),
    certificationCountry: z.string().optional(),
    certification: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    language: z.enum(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).optional(),
  })
  .strict();

export type MovieCatalogDiscoverQuery = z.infer<
  typeof MovieCatalogDiscoverQuerySchema
>;

export const MovieSearchHitResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number().nullable(),
  posterPath: z.string().url().nullable(),
  overview: z.string(),
  voteAverage: z.number().nullable(),
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
