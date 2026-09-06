import { Logger } from "@/lib/logger/logger";
import type {
  UserMovieEntryEntity,
  UserMovieEntryPatch,
} from "../../domain/entities/user-movie-entry.entity";
import { UserMovieEntryValidationException } from "../../domain/exceptions/user-movie-entry-validation.exception";
import { IUserMovieEntryRepository } from "../../domain/repositories/user-movie-entry.repository";
import { UserMovieEntryValidationUtils } from "../../domain/user-movie-entry-validation.utils";

const USER_MOVIE_ENTRY_PATCH_KEYS = [
  "watched",
  "favorite",
  "inWatchlist",
  "rating",
  "watchedAt",
  "movieId",
] as const;

export class UpsertUserMovieEntryUseCase {
  constructor(private userMovieEntryRepository: IUserMovieEntryRepository) {}

  async execute(
    userId: number,
    tmdbId: number,
    patch: UserMovieEntryPatch,
  ): Promise<UserMovieEntryEntity | null> {
    UpsertUserMovieEntryUseCase.assertNonEmptyPatch(patch);
    UserMovieEntryValidationUtils.assertValidUpsertInput(tmdbId, patch);

    const entry = await this.userMovieEntryRepository.upsert(
      userId,
      tmdbId,
      patch,
    );

    if (entry) {
      Logger.info("✅ User movie entry upserted", {
        userId,
        tmdbId,
        watched: entry.watched,
        favorite: entry.favorite,
        inWatchlist: entry.inWatchlist,
      });
    } else {
      Logger.info("✅ User movie entry removed (no active flags)", {
        userId,
        tmdbId,
      });
    }

    return entry;
  }

  private static assertNonEmptyPatch(patch: UserMovieEntryPatch): void {
    const hasMeaningfulPatchKey = USER_MOVIE_ENTRY_PATCH_KEYS.some((key) => {
      if (!Object.hasOwn(patch, key)) {
        return false;
      }

      const value = patch[key];
      const isUndefinedValue = value === undefined;

      return !isUndefinedValue;
    });

    if (!hasMeaningfulPatchKey) {
      throw new UserMovieEntryValidationException(
        "patch must contain at least one field to update",
      );
    }
  }
}
