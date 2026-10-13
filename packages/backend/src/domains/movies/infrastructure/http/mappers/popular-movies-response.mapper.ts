import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { TmdbPosterUtils } from "@/modules/tmdb/domain/tmdb-poster.utils";
import type {
  PopularMovieResponseDTO,
  PopularMoviesResponseDTO,
} from "../dto/popular-movies.dto";

export class PopularMoviesResponseMapper {
  static toResponse(movies: MovieCatalogDetails[]): PopularMoviesResponseDTO {
    const responseMovies = movies.map((movie) =>
      PopularMoviesResponseMapper.toMovie(movie),
    );

    return { movies: responseMovies };
  }

  private static toMovie(movie: MovieCatalogDetails): PopularMovieResponseDTO {
    return {
      tmdbId: movie.tmdbId,
      title: movie.title,
      year: movie.year,
      posterPath: TmdbPosterUtils.buildPosterUrl(movie.posterPath),
      overview: movie.overview,
      runtimeMinutes: movie.runtimeMinutes,
      voteAverage: movie.tmdbVoteAverage,
      directors: movie.directors,
    };
  }
}
