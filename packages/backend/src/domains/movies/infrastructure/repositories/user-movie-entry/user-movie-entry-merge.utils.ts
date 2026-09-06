import type {
  UserMovieEntryEntity,
  UserMovieEntryPatch,
} from "../../../domain/entities/user-movie-entry.entity";

export type UserMovieEntryMergedState = {
  watched: boolean;
  favorite: boolean;
  inWatchlist: boolean;
  rating: number | null;
  watchedAt: Date | null;
  movieId: number | null;
};

export class UserMovieEntryMergeUtils {
  static merge(
    existing: UserMovieEntryEntity | null,
    patch: UserMovieEntryPatch,
  ): UserMovieEntryMergedState {
    let watched = existing?.watched ?? false;
    let favorite = existing?.favorite ?? false;
    let inWatchlist = existing?.inWatchlist ?? false;
    let rating = existing?.rating ?? null;
    let watchedAt = existing?.watchedAt ?? null;
    let movieId = existing?.movieId ?? null;

    if (Object.hasOwn(patch, "watched")) {
      watched = patch.watched as boolean;
    }

    if (Object.hasOwn(patch, "favorite")) {
      favorite = patch.favorite as boolean;
    }

    if (Object.hasOwn(patch, "inWatchlist")) {
      inWatchlist = patch.inWatchlist as boolean;
    }

    if (Object.hasOwn(patch, "rating")) {
      rating = patch.rating ?? null;
    }

    if (Object.hasOwn(patch, "watchedAt")) {
      watchedAt = patch.watchedAt ?? null;
    }

    if (Object.hasOwn(patch, "movieId")) {
      movieId = patch.movieId ?? null;
    }

    return {
      watched,
      favorite,
      inWatchlist,
      rating,
      watchedAt,
      movieId,
    };
  }
}
