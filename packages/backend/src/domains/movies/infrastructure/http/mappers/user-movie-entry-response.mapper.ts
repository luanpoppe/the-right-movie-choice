import type { UserMovieEntryEntity } from "@/domains/movies/domain/entities/user-movie-entry.entity";
import type {
  UserMovieEntryGetResponseDTO,
  UserMovieEntryListResponseDTO,
  UserMovieEntryPatchResponseDTO,
  UserMovieEntryResponse,
} from "../dto/user-movie-entry.dto";

export class UserMovieEntryResponseMapper {
  static toResponse(entity: UserMovieEntryEntity): UserMovieEntryResponse {
    const watchedAt = entity.watchedAt;
    const watchedAtIso =
      watchedAt === null ? null : watchedAt.toISOString();

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
    entities: UserMovieEntryEntity[],
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
}
