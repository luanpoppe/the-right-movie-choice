import type {
  UserMovieEntryEntity,
  UserMovieEntryListItemEntity,
  UserMovieEntryMovieSummary,
} from "@/domains/movies/domain/entities/user-movie-entry.entity";
import type {
  UserMovieEntryGetResponseDTO,
  UserMovieEntryListResponseDTO,
  UserMovieEntryMovieSummaryResponse,
  UserMovieEntryPatchResponseDTO,
  UserMovieEntryResponse,
} from "../dto/user-movie-entry.dto";
import { TmdbPosterUtils } from "@/modules/tmdb/domain/tmdb-poster.utils";

type UserMovieEntryResponseSource =
  | UserMovieEntryEntity
  | UserMovieEntryListItemEntity;

export class UserMovieEntryResponseMapper {
  static toResponse(
    entity: UserMovieEntryResponseSource,
  ): UserMovieEntryResponse {
    const watchedAt = entity.watchedAt;
    const watchedAtIso =
      watchedAt === null ? null : watchedAt.toISOString();
    const movie = UserMovieEntryResponseMapper.resolveMovie(entity);

    const response: UserMovieEntryResponse = {
      tmdbId: entity.tmdbId,
      movieId: entity.movieId,
      watched: entity.watched,
      favorite: entity.favorite,
      inWatchlist: entity.inWatchlist,
      rating: entity.rating,
      watchedAt: watchedAtIso,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      movie,
    };

    return response;
  }

  static toGetEntryResponse(
    entity: UserMovieEntryEntity,
  ): UserMovieEntryGetResponseDTO {
    const entry = UserMovieEntryResponseMapper.toResponse(entity);
    const responseBody: UserMovieEntryGetResponseDTO = { entry };
    return responseBody;
  }

  static toListEntriesResponse(
    entities: UserMovieEntryResponseSource[],
  ): UserMovieEntryListResponseDTO {
    const entries = entities.map((entity) =>
      UserMovieEntryResponseMapper.toResponse(entity),
    );
    const responseBody: UserMovieEntryListResponseDTO = { entries };
    return responseBody;
  }

  static toPatchEntryResponse(
    entity: UserMovieEntryEntity | null,
  ): UserMovieEntryPatchResponseDTO {
    const entry =
      entity === null ? null : UserMovieEntryResponseMapper.toResponse(entity);
    const responseBody: UserMovieEntryPatchResponseDTO = { entry };
    return responseBody;
  }

  private static resolveMovie(
    entity: UserMovieEntryResponseSource,
  ): UserMovieEntryMovieSummaryResponse | null {
    const hasMovieField = Object.hasOwn(entity, "movie");
    if (!hasMovieField) {
      return null;
    }

    const listItem = entity as UserMovieEntryListItemEntity;
    const movieSummary = listItem.movie;
    if (movieSummary === null) {
      return null;
    }

    const movieResponse =
      UserMovieEntryResponseMapper.toMovieSummaryResponse(movieSummary);
    return movieResponse;
  }

  private static toMovieSummaryResponse(
    summary: UserMovieEntryMovieSummary,
  ): UserMovieEntryMovieSummaryResponse {
    const posterPathFromCatalog = summary.posterPath;
    const posterPath = TmdbPosterUtils.buildPosterUrl(posterPathFromCatalog);

    const response: UserMovieEntryMovieSummaryResponse = {
      title: summary.title,
      year: summary.year,
      posterPath,
    };
    return response;
  }
}
