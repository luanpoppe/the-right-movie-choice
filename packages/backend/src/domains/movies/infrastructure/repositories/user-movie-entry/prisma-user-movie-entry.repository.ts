import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import type {
  UserMovieEntryEntity,
  UserMovieEntryListFilter,
  UserMovieEntryPatch,
} from "../../../domain/entities/user-movie-entry.entity";
import { IUserMovieEntryRepository } from "../../../domain/repositories/user-movie-entry.repository";
import { UserMovieEntryValidationUtils } from "../../../domain/user-movie-entry-validation.utils";
import { UserMovieEntryPrismaMapper } from "../../mappers/user-movie-entry-prisma.mapper";
import { UserMovieEntryMergeUtils } from "./user-movie-entry-merge.utils";

class UserMovieEntryListFilterUtils {
  static buildWhere(
    userId: number,
    filter: UserMovieEntryListFilter,
  ): { userId: number; watched?: boolean; favorite?: boolean; inWatchlist?: boolean } {
    const where: {
      userId: number;
      watched?: boolean;
      favorite?: boolean;
      inWatchlist?: boolean;
    } = { userId };

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

export class PrismaUserMovieEntryRepository implements IUserMovieEntryRepository {
  async findByUserAndTmdbId(
    userId: number,
    tmdbId: number,
  ): Promise<UserMovieEntryEntity | null> {
    const uniqueWhere = {
      userId_tmdbId: {
        userId,
        tmdbId,
      },
    };

    const row = await prisma.userMovieEntry.findUnique({
      where: uniqueWhere,
    });

    if (!row) {
      Logger.debug("User movie entry find miss", { userId, tmdbId });
      return null;
    }

    Logger.debug("User movie entry find hit", { userId, tmdbId });
    const entity = UserMovieEntryPrismaMapper.toEntity(row);
    return entity;
  }

  async upsert(
    userId: number,
    tmdbId: number,
    patch: UserMovieEntryPatch,
  ): Promise<UserMovieEntryEntity | null> {
    UserMovieEntryValidationUtils.assertValidUpsertInput(tmdbId, patch);

    const uniqueWhere = {
      userId_tmdbId: {
        userId,
        tmdbId,
      },
    };

    const existingRow = await prisma.userMovieEntry.findUnique({
      where: uniqueWhere,
    });

    const existingEntity = existingRow
      ? UserMovieEntryPrismaMapper.toEntity(existingRow)
      : null;
    const merged = UserMovieEntryMergeUtils.merge(existingEntity, patch);

    const hasNoActiveFlags =
      !merged.watched && !merged.favorite && !merged.inWatchlist;

    if (hasNoActiveFlags) {
      if (existingRow) {
        await prisma.userMovieEntry.delete({
          where: uniqueWhere,
        });

        Logger.info("User movie entry deleted (no active flags)", {
          userId,
          tmdbId,
        });
      }

      return null;
    }

    const upsertData = {
      watched: merged.watched,
      favorite: merged.favorite,
      inWatchlist: merged.inWatchlist,
      rating: merged.rating,
      watchedAt: merged.watchedAt,
      movieId: merged.movieId,
    };

    const row = await prisma.userMovieEntry.upsert({
      where: uniqueWhere,
      create: {
        userId,
        tmdbId,
        ...upsertData,
      },
      update: upsertData,
    });

    Logger.info("User movie entry upsert ok", {
      userId,
      tmdbId,
      watched: merged.watched,
      favorite: merged.favorite,
      inWatchlist: merged.inWatchlist,
    });

    const entity = UserMovieEntryPrismaMapper.toEntity(row);
    return entity;
  }

  async listByUser(
    userId: number,
    filter: UserMovieEntryListFilter,
  ): Promise<UserMovieEntryEntity[]> {
    const where = UserMovieEntryListFilterUtils.buildWhere(userId, filter);

    const rows = await prisma.userMovieEntry.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    const logContext: Record<string, string | number | boolean | undefined> = {
      userId,
      count: rows.length,
    };

    if (Object.hasOwn(filter, "watched")) {
      const watched = filter.watched;
      if (watched !== undefined) {
        logContext.filterWatched = watched;
      }
    }

    if (Object.hasOwn(filter, "favorite")) {
      const favorite = filter.favorite;
      if (favorite !== undefined) {
        logContext.filterFavorite = favorite;
      }
    }

    if (Object.hasOwn(filter, "inWatchlist")) {
      const inWatchlist = filter.inWatchlist;
      if (inWatchlist !== undefined) {
        logContext.filterInWatchlist = inWatchlist;
      }
    }

    Logger.debug("User movie entry list", logContext);

    const entities = rows.map((row) => UserMovieEntryPrismaMapper.toEntity(row));
    return entities;
  }
}
