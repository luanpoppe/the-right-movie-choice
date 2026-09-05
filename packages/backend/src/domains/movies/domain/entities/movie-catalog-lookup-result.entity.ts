import type { MovieCatalogDetails } from './movie-catalog-details.entity';

export type MovieCatalogLookupInput = {
  query: string;
  year?: number;
  language?: string;
};

export type MovieCatalogLookupFound = {
  found: true;
  details: MovieCatalogDetails;
};

export type MovieCatalogLookupMiss = {
  found: false;
  message: string;
};

export type MovieCatalogLookupResult =
  | MovieCatalogLookupFound
  | MovieCatalogLookupMiss;
