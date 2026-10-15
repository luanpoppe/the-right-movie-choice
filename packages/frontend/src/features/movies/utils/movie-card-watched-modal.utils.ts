import { UserMovieEntryPatchDTO } from "@/features/movies/dto/user-movie-entry.dto";

const INVALID_RATING_MESSAGE = "Rating must be an integer between 1 and 10";
const DATE_INPUT_LENGTH = 10;

type RatingReadResult =
  | { status: "empty" }
  | { status: "valid"; rating: number }
  | { status: "invalid" };

interface SavePatchInput {
  isEditing: boolean;
  ratingInput: string;
  dateInput: string;
}

type SavePatchResult =
  | { ok: true; patch: UserMovieEntryPatchDTO }
  | { ok: false; error: string };

export class MovieCardWatchedModalUtils {
  static toDateInputValue(watchedAt: string | null): string {
    const isMissing = watchedAt === null || watchedAt === "";
    if (isMissing) {
      return "";
    }

    return watchedAt.slice(0, DATE_INPUT_LENGTH);
  }

  static parseWatchedAt(dateInput: string): string | null {
    const trimmedDateInput = dateInput.trim();
    if (trimmedDateInput === "") {
      return null;
    }

    return `${trimmedDateInput}T00:00:00.000Z`;
  }

  static readRating(ratingInput: string): RatingReadResult {
    const trimmedRatingInput = ratingInput.trim();
    if (trimmedRatingInput === "") {
      return { status: "empty" };
    }

    const parsedRating = Number(trimmedRatingInput);
    const isInteger = Number.isInteger(parsedRating);
    const isInRange = parsedRating >= 1 && parsedRating <= 10;
    const isValidRating = isInteger && isInRange;

    if (!isValidRating) {
      return { status: "invalid" };
    }

    return { status: "valid", rating: parsedRating };
  }

  static buildSavePatch(input: SavePatchInput): SavePatchResult {
    const ratingResult = MovieCardWatchedModalUtils.readRating(input.ratingInput);
    if (ratingResult.status === "invalid") {
      return { ok: false, error: INVALID_RATING_MESSAGE };
    }

    const patch: UserMovieEntryPatchDTO = { watched: true };

    MovieCardWatchedModalUtils.applyRatingPatch(patch, ratingResult, input.isEditing);

    const watchedAt = MovieCardWatchedModalUtils.parseWatchedAt(input.dateInput);
    MovieCardWatchedModalUtils.applyWatchedAtPatch(patch, watchedAt, input.isEditing);

    return { ok: true, patch };
  }

  static buildDeletePatch(): UserMovieEntryPatchDTO {
    return { watched: false, rating: null, watchedAt: null };
  }

  private static applyRatingPatch(
    patch: UserMovieEntryPatchDTO,
    ratingResult: RatingReadResult,
    isEditing: boolean,
  ): void {
    if (ratingResult.status === "valid") {
      patch.rating = ratingResult.rating;
      return;
    }

    if (isEditing) {
      patch.rating = null;
    }
  }

  private static applyWatchedAtPatch(
    patch: UserMovieEntryPatchDTO,
    watchedAt: string | null,
    isEditing: boolean,
  ): void {
    if (watchedAt !== null) {
      patch.watchedAt = watchedAt;
      return;
    }

    if (isEditing) {
      patch.watchedAt = null;
    }
  }
}
