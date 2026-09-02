import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieSearchPage } from "@/domains/movies/domain/entities/movie-search.entity";

export interface IMovieCatalogProvider {
  searchMovies(query: string, page?: number): Promise<MovieSearchPage>;

  getMovieDetails(movieId: number): Promise<MovieCatalogDetails>;
}
