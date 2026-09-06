import type { UserMovieEntryListFilter } from "../../../domain/entities/user-movie-entry.entity";

export type UserMovieEntryPrismaWhere = {
  userId: number;
  watched?: boolean;
  favorite?: boolean;
  inWatchlist?: boolean;
};

export class UserMovieEntryListFilterUtils {
  static buildWhere(
    userId: number,
    filter: UserMovieEntryListFilter,
  ): UserMovieEntryPrismaWhere {
    const where: UserMovieEntryPrismaWhere = { userId };

    if (Object.hasOwn(filter, "watched")) {
      const watched = filter.watched;
      if (watched !== undefined) {
        where.watched = watched;
      }
    }

    if (Object.hasOwn(filter, "favorite")) {
      const favorite = filter.favorite;
      if (favorite !== undefined) {
        where.favorite = favorite;
      }
    }

    if (Object.hasOwn(filter, "inWatchlist")) {
      const inWatchlist = filter.inWatchlist;
      if (inWatchlist !== undefined) {
        where.inWatchlist = inWatchlist;
      }
    }

    return where;
  }
}
