import { MovieCatalogDetails } from "../entities/movie-catalog-details.entity";

export const DEFAULT_MOVIE_CATALOG_LANGUAGE = "pt-BR";

export type MovieCatalogStoredRecord = {
  details: MovieCatalogDetails;
  updatedAt: Date;
};

export type MovieCatalogTitleYearLookupInput = {
  title: string;
  year?: number;
  language?: string;
};

export interface IMovieCatalogRepository {
  upsert(details: MovieCatalogDetails, language?: string): Promise<void>;

  findByTmdbId(
    tmdbId: number,
    language?: string,
  ): Promise<MovieCatalogStoredRecord | null>;

  findByTitleAndYear(
    title: string,
    year?: number,
    language?: string,
  ): Promise<MovieCatalogStoredRecord | null>;

  findByTitlesAndYears(
    inputs: MovieCatalogTitleYearLookupInput[],
  ): Promise<Array<MovieCatalogStoredRecord | null>>;
}
