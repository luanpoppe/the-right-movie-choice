import {
  SingleMovieReccomendationInternalEntity,
  SingleMovieReccomendationSchema,
} from "@/domains/movies/domain/entities/movie-recommendation.entity";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { TmdbPosterUtils } from "@/modules/tmdb/domain/tmdb-poster.utils";
import type {
  MovieRecommendationResponseDTO,
  SingleMovieReccomendationResponse,
} from "../dto/movie-recommendation.dto";

export class MovieRecommendationResponseMapper {
  constructor(private readonly catalogRepository: IMovieCatalogRepository) {}

  async toResponse(
    movies: SingleMovieReccomendationInternalEntity[],
    response: string,
  ): Promise<MovieRecommendationResponseDTO> {
    const publicMovies = await Promise.all(
      movies.map((movie) => this.toPublicMovie(movie)),
    );

    const responseBody: MovieRecommendationResponseDTO = {
      response,
      movies: publicMovies,
    };
    return responseBody;
  }

  private async toPublicMovie(
    movie: SingleMovieReccomendationInternalEntity,
  ): Promise<SingleMovieReccomendationResponse> {
    const publicMovie = SingleMovieReccomendationSchema.parse(movie);
    const posterPath = await this.resolvePosterPath(publicMovie.tmdbId);

    const response: SingleMovieReccomendationResponse = {
      ...publicMovie,
      posterPath,
    };
    return response;
  }

  private async resolvePosterPath(
    tmdbId?: number,
  ): Promise<string | null> {
    if (tmdbId === undefined) {
      return null;
    }

    const catalogRecord = await this.catalogRepository.findByTmdbId(tmdbId);
    if (catalogRecord === null) {
      return null;
    }

    const posterPathFromCatalog = catalogRecord.details.posterPath;
    const posterUrl = TmdbPosterUtils.buildPosterUrl(posterPathFromCatalog);
    return posterUrl;
  }
}
