import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaErrorMapper } from "@/shared/mappers/prisma-error.mapper";
import type { MovieCatalogDetails } from "../../../domain/entities/movie-catalog-details.entity";
import { MovieCatalogImdbConflictException } from "../../../domain/exceptions/movie-catalog-imdb-conflict.exception";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  IMovieCatalogRepository,
} from "../../../domain/repositories/movie-catalog.repository";
import { MovieCatalogPrismaMapper } from "../../mappers/movie-catalog-prisma.mapper";
import { StringUtils } from "@/shared/utils/string.utils";
import { MovieCatalogChildWriter } from "./child-writer";
import { MovieCatalogMovieWritePayloadBuilder } from "./movie-write-payload.builder";
import { MovieCatalogTitleSearchSql } from "./title-search-sql";

const MOVIE_CATALOG_CHILDREN_INCLUDE = {
  genres: true,
  directors: true,
  cast: true,
  originCountries: true,
  watchProviders: true,
};

export class PrismaMovieCatalogRepository implements IMovieCatalogRepository {
  async upsert(details: MovieCatalogDetails, language?: string): Promise<void> {
    const catalogLanguage = language ?? DEFAULT_MOVIE_CATALOG_LANGUAGE;
    const movieScalars = MovieCatalogMovieWritePayloadBuilder.buildScalars(
      details,
      catalogLanguage,
    );

    const tmdbId = details.tmdbId;
    const uniqueWhere = {
      tmdbId_language: {
        tmdbId,
        language: catalogLanguage,
      },
    };

    try {
      const movie = await prisma.$transaction(async (tx) => {
        const upsertedMovie = await tx.movie.upsert({
          where: uniqueWhere,
          create: movieScalars,
          update: movieScalars,
        });
        const movieId = upsertedMovie.id;

        await MovieCatalogChildWriter.replaceAll(tx, movieId, details);

        return upsertedMovie;
      });

      Logger.info("Movie catalog upsert ok", {
        tmdbId,
        language: catalogLanguage,
        movieId: movie.id,
      });
    } catch (error) {
      Logger.error("Movie catalog upsert failed", {
        tmdbId,
        language: catalogLanguage,
      });

      const imdbId = details.imdbId ?? "";
      const conflictException = new MovieCatalogImdbConflictException(
        imdbId,
        catalogLanguage,
      );
      PrismaErrorMapper.mapUniqueViolationOrRethrow(error, conflictException);
    }
  }

  async findByTmdbId(
    tmdbId: number,
    language?: string,
  ): Promise<MovieCatalogDetails | null> {
    const catalogLanguage = language ?? DEFAULT_MOVIE_CATALOG_LANGUAGE;

    const row = await prisma.movie.findFirst({
      where: {
        tmdbId,
        language: catalogLanguage,
      },
      include: MOVIE_CATALOG_CHILDREN_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });

    if (!row) {
      Logger.debug("Movie catalog find by tmdbId miss", {
        tmdbId,
        language: catalogLanguage,
      });
      return null;
    }

    Logger.debug("Movie catalog find by tmdbId hit", {
      tmdbId,
      language: catalogLanguage,
    });

    const details = MovieCatalogPrismaMapper.toDetails(row);
    return details;
  }

  async findByTitleAndYear(
    title: string,
    year?: number,
    language?: string,
  ): Promise<MovieCatalogDetails | null> {
    const catalogLanguage = language ?? DEFAULT_MOVIE_CATALOG_LANGUAGE;
    if (StringUtils.isEmptyString(title)) {
      Logger.debug("Movie catalog find by title and year miss", {
        title,
        year,
        language: catalogLanguage,
      });
      return null;
    }

    const likePattern = MovieCatalogTitleSearchSql.buildLikePattern(title);
    const findIdQuery = MovieCatalogTitleSearchSql.buildFindIdQuery(
      catalogLanguage,
      likePattern,
      year,
    );
    const idRows = await prisma.$queryRaw<{ id: number }[]>(findIdQuery);
    const matchedId = idRows[0]?.id;

    if (matchedId === undefined) {
      Logger.debug("Movie catalog find by title and year miss", {
        title,
        year,
        language: catalogLanguage,
      });
      return null;
    }

    const row = await prisma.movie.findFirst({
      where: { id: matchedId },
      include: MOVIE_CATALOG_CHILDREN_INCLUDE,
    });

    if (!row) {
      Logger.debug("Movie catalog find by title and year miss", {
        title,
        year,
        language: catalogLanguage,
      });
      return null;
    }

    Logger.debug("Movie catalog find by title and year hit", {
      tmdbId: row.tmdbId,
      language: catalogLanguage,
    });

    const details = MovieCatalogPrismaMapper.toDetails(row);
    return details;
  }
}
