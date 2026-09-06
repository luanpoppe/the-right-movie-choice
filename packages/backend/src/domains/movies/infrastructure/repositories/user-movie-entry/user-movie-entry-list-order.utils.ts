import type { Prisma } from "../../../../../../generated/prisma/client.js";
import type { UserMovieEntryListFilter } from "../../../domain/entities/user-movie-entry.entity";

export class UserMovieEntryListOrderUtils {
  static buildOrderBy(
    filter: UserMovieEntryListFilter,
  ): Prisma.UserMovieEntryOrderByWithRelationInput {
    const hasWatchedTrueFilter =
      Object.hasOwn(filter, "watched") && filter.watched === true;

    if (hasWatchedTrueFilter) {
      return {
        watchedAt: { sort: "desc", nulls: "last" },
      };
    }

    return { updatedAt: "desc" };
  }
}
