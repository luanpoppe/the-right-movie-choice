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

export const MovieCatalogSearchToolInputSchema = z
  .object({
    query: z.string().optional(),
    year: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().min(1).optional(),
    genres: z.array(z.coerce.number()).optional(),
    minRating: z.coerce.number().optional(),
    yearFrom: z.coerce.number().optional(),
    yearTo: z.coerce.number().optional(),
    runtimeFrom: z.coerce.number().optional(),
    runtimeTo: z.coerce.number().optional(),
    certificationCountry: z.string().optional(),
    certification: z.string().optional(),
    language: z.enum(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).optional(),
  })
  .strict();

export const MovieCatalogSearchToolModelSchema = z
  .object({
    query: z
      .unknown()
      .optional()
      .describe(
        "Título ou termo de busca no catálogo (texto). Omita para descobrir por filtros ou populares.",
      ),
    year: z
      .unknown()
      .optional()
      .describe(
        "Ano de lançamento. Só é aceito junto de query de texto; use yearFrom/yearTo para faixas.",
      ),
    genres: z
      .unknown()
      .optional()
      .describe(
        "Ids de gênero do TMDB (ex.: 28 ação, 35 comédia, 18 drama, 27 terror, 878 ficção científica).",
      ),
    minRating: z
      .unknown()
      .optional()
      .describe("Nota mínima de 0 a 10."),
    yearFrom: z.unknown().optional().describe("Ano inicial da faixa."),
    yearTo: z.unknown().optional().describe("Ano final da faixa."),
    runtimeFrom: z.unknown().optional().describe("Duração mínima em minutos."),
    runtimeTo: z.unknown().optional().describe("Duração máxima em minutos."),
    certificationCountry: z
      .unknown()
      .optional()
      .describe("País da certificação, ex.: BR."),
    certification: z
      .unknown()
      .optional()
      .describe("Certificação etária, ex.: 14."),
    language: z
      .unknown()
      .optional()
      .describe("Idioma da resposta: en-US (default) ou pt-BR."),
  })
  .passthrough();

export type MovieCatalogSearchToolInput = z.infer<
  typeof MovieCatalogSearchToolInputSchema
>;
