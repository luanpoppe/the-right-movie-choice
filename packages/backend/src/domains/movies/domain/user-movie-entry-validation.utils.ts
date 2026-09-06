import { NullishUtils } from "@/shared/utils/nullish.utils";
import type { UserMovieEntryPatch } from "./entities/user-movie-entry.entity";
import { UserMovieEntryValidationException } from "./exceptions/user-movie-entry-validation.exception";

export class UserMovieEntryValidationUtils {
  static readonly MIN_RATING = 1;
  static readonly MAX_RATING = 10;

  static assertValidTmdbId(tmdbId: number): void {
    const isPositiveInteger = Number.isInteger(tmdbId) && tmdbId > 0;

    if (!isPositiveInteger) {
      throw new UserMovieEntryValidationException(
        `tmdbId must be a positive integer, received ${tmdbId}`,
      );
    }
  }

  static assertValidRating(rating: number | null | undefined): void {
    if (NullishUtils.isNullish(rating)) {
      return;
    }

    const isIntegerInRange =
      Number.isInteger(rating) &&
      rating >= UserMovieEntryValidationUtils.MIN_RATING &&
      rating <= UserMovieEntryValidationUtils.MAX_RATING;

    if (!isIntegerInRange) {
      throw new UserMovieEntryValidationException(
        `rating must be an integer between ${UserMovieEntryValidationUtils.MIN_RATING} and ${UserMovieEntryValidationUtils.MAX_RATING}, received ${rating}`,
      );
    }
  }

  static assertValidPatch(patch: UserMovieEntryPatch): void {
    if (!Object.hasOwn(patch, "rating")) {
      return;
    }

    const rating = patch.rating;
    UserMovieEntryValidationUtils.assertValidRating(rating);
  }

  static assertValidUpsertInput(
    tmdbId: number,
    patch: UserMovieEntryPatch,
  ): void {
    UserMovieEntryValidationUtils.assertValidTmdbId(tmdbId);
    UserMovieEntryValidationUtils.assertValidPatch(patch);
  }
}
