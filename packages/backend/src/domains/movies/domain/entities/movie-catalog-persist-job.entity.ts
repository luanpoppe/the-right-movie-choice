import type { MovieCatalogDetails } from "./movie-catalog-details.entity";

export type MovieCatalogPersistJobData = {
  language: string;
  details: MovieCatalogDetails;
};
