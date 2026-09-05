import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaErrorMapper } from "@/shared/mappers/prisma-error.mapper";
import type { MovieCatalogDetails } from "../../../domain/entities/movie-catalog-details.entity";
import { MovieCatalogImdbConflictException } from "../../../domain/exceptions/movie-catalog-imdb-conflict.exception";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  IMovieCatalogRepository,
} from "../../../domain/repositories/movie-catalog.repository";
import { MovieCatalogChildWriter } from "./child-writer";
import { MovieCatalogMovieWritePayloadBuilder } from "./movie-write-payload.builder";

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
    _tmdbId: number,
    _language?: string,
  ): Promise<MovieCatalogDetails | null> {
    throw new Error("not implemented");
  }

  async findByTitleAndYear(
    _title: string,
    _year?: number,
    _language?: string,
  ): Promise<MovieCatalogDetails | null> {
    throw new Error("not implemented");
  }
}
