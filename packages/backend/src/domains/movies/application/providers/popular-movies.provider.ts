import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";

export interface IPopularMoviesProvider {
  getPopularMovies(language?: string): Promise<MovieCatalogDetails[]>;

  refreshPopularMovies(language?: string): Promise<MovieCatalogDetails[]>;
}
