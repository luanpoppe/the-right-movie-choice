import z from "zod";

export const MovieCatalogLanguageSchema = z.enum(["en-US", "pt-BR"]);

export type MovieCatalogLanguage = z.infer<typeof MovieCatalogLanguageSchema>;

export const MovieSearchHitSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number().nullable(),
  posterPath: z.string().url().nullable(),
  overview: z.string(),
});

export const MovieSearchPageSchema = z.object({
  page: z.number(),
  results: z.array(MovieSearchHitSchema),
});

export type MovieSearchHit = z.infer<typeof MovieSearchHitSchema>;
export type MovieSearchPage = z.infer<typeof MovieSearchPageSchema>;

export const MoviePersonKnownForSchema = z.object({
  id: z.number(),
  title: z.string(),
});

export const MoviePersonSearchHitSchema = z.object({
  id: z.number(),
  name: z.string(),
  knownForDepartment: z.string().nullable(),
  knownFor: z.array(MoviePersonKnownForSchema),
});

export const MoviePersonSearchPageSchema = z.object({
  page: z.number(),
  results: z.array(MoviePersonSearchHitSchema),
});

export type MoviePersonKnownFor = z.infer<typeof MoviePersonKnownForSchema>;
export type MoviePersonSearchHit = z.infer<typeof MoviePersonSearchHitSchema>;
export type MoviePersonSearchPage = z.infer<typeof MoviePersonSearchPageSchema>;

export const MovieKeywordSearchHitSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const MovieKeywordSearchPageSchema = z.object({
  page: z.number(),
  results: z.array(MovieKeywordSearchHitSchema),
});

export type MovieKeywordSearchHit = z.infer<typeof MovieKeywordSearchHitSchema>;
export type MovieKeywordSearchPage = z.infer<
  typeof MovieKeywordSearchPageSchema
>;

export type MovieCatalogDiscoverFilters = {
  genres?: number[];
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
  cast?: number[];
  director?: number[];
  keyword?: number[];
  runtimeFrom?: number;
  runtimeTo?: number;
  certificationCountry?: string;
  certification?: string;
};
