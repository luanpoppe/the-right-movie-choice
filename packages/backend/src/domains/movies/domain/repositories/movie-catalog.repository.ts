import { MovieCatalogDetails } from "../entities/movie-catalog-details.entity";

export const DEFAULT_MOVIE_CATALOG_LANGUAGE = "pt-BR";

export interface IMovieCatalogRepository {
  upsert(details: MovieCatalogDetails, language?: string): Promise<void>;

  findByTmdbId(
    tmdbId: number,
    language?: string,
  ): Promise<MovieCatalogDetails | null>;

  findByTitleAndYear(
    title: string,
    year?: number,
    language?: string,
  ): Promise<MovieCatalogDetails | null>;
}
