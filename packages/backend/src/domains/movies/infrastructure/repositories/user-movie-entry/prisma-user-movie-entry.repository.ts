import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import type {
  UserMovieEntryEntity,
  UserMovieEntryListFilter,
  UserMovieEntryListItemEntity,
  UserMovieEntryMovieSummary,
  UserMovieEntryPatch,
} from "../../../domain/entities/user-movie-entry.entity";
import { DEFAULT_MOVIE_CATALOG_LANGUAGE } from "../../../domain/repositories/movie-catalog.repository";
import { IUserMovieEntryRepository } from "../../../domain/repositories/user-movie-entry.repository";
import { UserMovieEntryValidationUtils } from "../../../domain/user-movie-entry-validation.utils";
import { UserMovieEntryPrismaMapper } from "../../mappers/user-movie-entry-prisma.mapper";
import { UserMovieEntryListFilterUtils } from "./user-movie-entry-list-filter.utils";
import { UserMovieEntryListOrderUtils } from "./user-movie-entry-list-order.utils";
import { UserMovieEntryMergeUtils } from "./user-movie-entry-merge.utils";

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
    const orderBy = UserMovieEntryListOrderUtils.buildOrderBy(filter);

    const rows = await prisma.userMovieEntry.findMany({
      where,
      orderBy,
    });

    const tmdbIds = rows.map((row) => row.tmdbId);
    const catalogByTmdbId = await this.loadMovieSummariesByTmdbIds(tmdbIds);

    const logContext: Record<string, string | number | boolean | undefined> = {
      userId,
      count: rows.length,
      catalogHits: catalogByTmdbId.size,
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

    const hasWatchedTrueFilter =
      Object.hasOwn(filter, "watched") && filter.watched === true;
    logContext.orderByWatchedAt = hasWatchedTrueFilter;

    Logger.debug("User movie entry list", logContext);

    const entities = rows.map((row) => {
      const baseEntity = UserMovieEntryPrismaMapper.toEntity(row);
      const catalogSummary = catalogByTmdbId.get(row.tmdbId) ?? null;
      const listItem: UserMovieEntryListItemEntity = {
        ...baseEntity,
        movie: catalogSummary,
      };
      return listItem;
    });

    return entities;
  }

  private async loadMovieSummariesByTmdbIds(
    tmdbIds: number[],
  ): Promise<Map<number, UserMovieEntryMovieSummary>> {
    const uniqueTmdbIds = [...new Set(tmdbIds)];

    if (uniqueTmdbIds.length === 0) {
      return new Map();
    }

    Logger.debug("🔍 Carregando catálogo para listagem de entradas", {
      tmdbIdCount: uniqueTmdbIds.length,
      language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
    });

    const catalogRows = await prisma.movie.findMany({
      where: {
        tmdbId: { in: uniqueTmdbIds },
        language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
      },
      select: {
        tmdbId: true,
        title: true,
        year: true,
        posterPath: true,
      },
    });

    const catalogByTmdbId = new Map<number, UserMovieEntryMovieSummary>();

    for (const catalogRow of catalogRows) {
      const summary: UserMovieEntryMovieSummary = {
        title: catalogRow.title,
        year: catalogRow.year,
        posterPath: catalogRow.posterPath,
      };
      catalogByTmdbId.set(catalogRow.tmdbId, summary);
    }

    const missCount = uniqueTmdbIds.length - catalogByTmdbId.size;
    const hasCatalogMisses = missCount > 0;

    if (hasCatalogMisses) {
      Logger.debug("⚠️ Catálogo incompleto para alguns tmdbIds da listagem", {
        requestedCount: uniqueTmdbIds.length,
        hitCount: catalogByTmdbId.size,
        missCount,
      });
    }

    return catalogByTmdbId;
  }
}
