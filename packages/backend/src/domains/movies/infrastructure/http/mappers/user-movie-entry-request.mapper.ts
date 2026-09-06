import type {
  UserMovieEntryListFilter,
  UserMovieEntryPatch,
} from "@/domains/movies/domain/entities/user-movie-entry.entity";
import type {
  UserMovieEntryListQueryDTO,
  UserMovieEntryPatchDTO,
} from "../dto/user-movie-entry.dto";

const PATCH_BOOLEAN_KEYS = ["watched", "favorite", "inWatchlist"] as const;

const LIST_FILTER_COPY_KEYS = [
  "watched",
  "favorite",
  "inWatchlist",
] as const;

export class UserMovieEntryRequestMapper {
  static toPatchDomain(dto: UserMovieEntryPatchDTO): UserMovieEntryPatch {
    const patch: UserMovieEntryPatch = {};

    for (const key of PATCH_BOOLEAN_KEYS) {
      if (!Object.hasOwn(dto, key)) {
        continue;
      }

      const value = dto[key];

      if (value === undefined) {
        continue;
      }

      patch[key] = value;
    }

    if (Object.hasOwn(dto, "rating") && dto.rating !== undefined) {
      patch.rating = dto.rating;
    }

    UserMovieEntryRequestMapper.assignWatchedAt(dto, patch);

    return patch;
  }

  private static assignWatchedAt(
    dto: UserMovieEntryPatchDTO,
    patch: UserMovieEntryPatch,
  ): void {
    if (!Object.hasOwn(dto, "watchedAt")) {
      return;
    }

    const watchedAt = dto.watchedAt;

    if (watchedAt === null) {
      patch.watchedAt = null;
      return;
    }

    if (watchedAt === undefined) {
      return;
    }

    patch.watchedAt = new Date(watchedAt);
  }

  static toListFilter(
    dto: UserMovieEntryListQueryDTO,
  ): UserMovieEntryListFilter {
    const filter: UserMovieEntryListFilter = {};

    for (const key of LIST_FILTER_COPY_KEYS) {
      if (!Object.hasOwn(dto, key)) {
        continue;
      }

      const value = dto[key];

      if (value === undefined) {
        continue;
      }

      filter[key] = value;
    }

    return filter;
  }
}
