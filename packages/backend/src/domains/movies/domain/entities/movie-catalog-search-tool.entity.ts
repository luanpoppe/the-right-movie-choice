import z from "zod";
import { MovieCatalogSearchConstants } from "@/domains/movies/domain/movie-catalog-search.constants";

export type MovieCatalogSearchToolHit = {
  id: number;
  title: string;
  year: number | null;
  overview: string;
  posterUrl: string | null;
};

export type MovieCatalogSearchToolResult = {
  found: boolean;
  results: MovieCatalogSearchToolHit[];
  notice?: string;
};

export const MovieCatalogSearchToolInputSchema = z.object({
  query: z.string().optional(),
  year: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  genres: z.array(z.coerce.number()).optional(),
  minRating: z.coerce.number().optional(),
  yearFrom: z.coerce.number().optional(),
  yearTo: z.coerce.number().optional(),
  runtimeFrom: z.coerce.number().optional(),
  runtimeTo: z.coerce.number().optional(),
  certificationCountry: z.string().optional(),
  certification: z.string().optional(),
  language: z.enum(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).optional(),
});

export type MovieCatalogSearchToolInput = z.infer<
  typeof MovieCatalogSearchToolInputSchema
>;
