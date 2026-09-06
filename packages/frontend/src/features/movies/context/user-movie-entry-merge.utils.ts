import { UserMovieEntryPatchDTO } from "../dto/user-movie-entry.dto";
import { UserMovieEntryEntity } from "../entities/user-movie-entry.entity";

export type UserMovieEntryFlags = {
  watched: boolean;
  favorite: boolean;
  inWatchlist: boolean;
  rating: number | null;
  watchedAt: string | null;
};

export const DEFAULT_USER_MOVIE_ENTRY_FLAGS: UserMovieEntryFlags = {
  watched: false,
  favorite: false,
  inWatchlist: false,
  rating: null,
  watchedAt: null,
};

export class UserMovieEntryMergeUtils {
  static applyOptimisticPatch(
    existing: UserMovieEntryEntity | undefined,
    tmdbId: number,
    patch: UserMovieEntryPatchDTO,
  ): UserMovieEntryEntity {
    const now = new Date().toISOString();

    if (!existing) {
      const optimisticEntry: UserMovieEntryEntity = {
        tmdbId,
        movieId: null,
        watched: patch.watched ?? false,
        favorite: patch.favorite ?? false,
        inWatchlist: patch.inWatchlist ?? false,
        rating: patch.rating !== undefined ? patch.rating : null,
        watchedAt: patch.watchedAt !== undefined ? patch.watchedAt : null,
        createdAt: now,
        updatedAt: now,
      };
      return optimisticEntry;
    }

    const mergedEntry: UserMovieEntryEntity = {
      ...existing,
      updatedAt: now,
    };

    if (patch.watched !== undefined) {
      mergedEntry.watched = patch.watched;
    }
    if (patch.favorite !== undefined) {
      mergedEntry.favorite = patch.favorite;
    }
    if (patch.inWatchlist !== undefined) {
      mergedEntry.inWatchlist = patch.inWatchlist;
    }
    if (patch.rating !== undefined) {
      mergedEntry.rating = patch.rating;
    }
    if (patch.watchedAt !== undefined) {
      mergedEntry.watchedAt = patch.watchedAt;
    }

    return mergedEntry;
  }

  static toFlags(entry: UserMovieEntryEntity): UserMovieEntryFlags {
    return {
      watched: entry.watched,
      favorite: entry.favorite,
      inWatchlist: entry.inWatchlist,
      rating: entry.rating,
      watchedAt: entry.watchedAt,
    };
  }
}
