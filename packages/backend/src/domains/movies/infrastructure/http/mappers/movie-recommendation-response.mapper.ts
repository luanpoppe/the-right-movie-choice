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

type CatalogFields = {
  posterPath: string | null;
  tmdbVoteAverage: number | null;
};

const EMPTY_CATALOG_FIELDS: CatalogFields = {
  posterPath: null,
  tmdbVoteAverage: null,
};

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
    const catalogFields = await this.resolveCatalogFields(publicMovie.tmdbId);

    const response: SingleMovieReccomendationResponse = {
      ...publicMovie,
      posterPath: catalogFields.posterPath,
      tmdbVoteAverage: catalogFields.tmdbVoteAverage,
    };
    return response;
  }

  private async resolveCatalogFields(
    tmdbId?: number,
  ): Promise<CatalogFields> {
    if (tmdbId === undefined) {
      return EMPTY_CATALOG_FIELDS;
    }

    const catalogRecord = await this.catalogRepository.findByTmdbId(tmdbId);
    if (catalogRecord === null) {
      return EMPTY_CATALOG_FIELDS;
    }

    const details = catalogRecord.details;

    return {
      posterPath: TmdbPosterUtils.buildPosterUrl(details.posterPath),
      tmdbVoteAverage: details.tmdbVoteAverage,
    };
  }
}
