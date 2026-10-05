import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieDiscoverQuery } from "@/domains/movies/domain/entities/movie-discover-query.entity";
import type { MovieKeywordSearchPage } from "@/domains/movies/domain/entities/movie-keyword-search.entity";
import type { MoviePersonSearchPage } from "@/domains/movies/domain/entities/movie-person-search.entity";
import type { MovieSearchPage } from "@/domains/movies/domain/entities/movie-search.entity";

export interface IMovieCatalogProvider {
  searchMovies(
    query: string,
    page?: number,
    year?: number,
    language?: string,
  ): Promise<MovieSearchPage>;

  getMovieDetails(
    movieId: number,
    language?: string,
  ): Promise<MovieCatalogDetails>;

  searchPeople(
    query: string,
    page?: number,
    language?: string,
  ): Promise<MoviePersonSearchPage>;

  searchKeywords(
    query: string,
    page?: number,
  ): Promise<MovieKeywordSearchPage>;

  discoverMovies(query: MovieDiscoverQuery): Promise<MovieSearchPage>;
}
