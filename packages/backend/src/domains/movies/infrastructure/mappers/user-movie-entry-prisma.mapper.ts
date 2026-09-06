import type { UserMovieEntry as PrismaUserMovieEntry } from "../../../../../generated/prisma/client.js";
import type {
  UserMovieEntryEntity,
  UserMovieEntryListItemEntity,
  UserMovieEntryMovieSummary,
} from "../../domain/entities/user-movie-entry.entity";

export class UserMovieEntryPrismaMapper {
  static toEntity(row: PrismaUserMovieEntry): UserMovieEntryEntity {
    return {
      userId: row.userId,
      tmdbId: row.tmdbId,
      movieId: row.movieId,
      watched: row.watched,
      favorite: row.favorite,
      inWatchlist: row.inWatchlist,
      rating: row.rating,
      watchedAt: row.watchedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  static toListItemEntity(
    entity: UserMovieEntryEntity,
    movie: UserMovieEntryMovieSummary | null,
  ): UserMovieEntryListItemEntity {
    const listItem: UserMovieEntryListItemEntity = {
      ...entity,
      movie,
    };
    return listItem;
  }
}
