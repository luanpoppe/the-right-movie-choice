import { prisma } from "@/lib/prisma/prisma";
import type { MovieCatalogDetails } from "../../../domain/entities/movie-catalog-details.entity";
import { MovieCatalogChildWritePayloadBuilder } from "./child-write-payload.builder";

type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export class MovieCatalogChildWriter {
  static async replaceAll(
    tx: PrismaTransactionClient,
    movieId: number,
    details: MovieCatalogDetails,
  ): Promise<void> {
    await tx.movieGenre.deleteMany({ where: { movieId } });
    await tx.movieDirector.deleteMany({ where: { movieId } });
    await tx.movieCast.deleteMany({ where: { movieId } });
    await tx.movieOriginCountry.deleteMany({ where: { movieId } });
    await tx.movieWatchProvider.deleteMany({ where: { movieId } });

    const genreRows = MovieCatalogChildWritePayloadBuilder.buildGenreRows(
      movieId,
      details.genres,
    );
    if (genreRows.length > 0) {
      await tx.movieGenre.createMany({ data: genreRows });
    }

    const directorRows = MovieCatalogChildWritePayloadBuilder.buildDirectorRows(
      movieId,
      details.directors,
    );
    if (directorRows.length > 0) {
      await tx.movieDirector.createMany({ data: directorRows });
    }

    const castRows = MovieCatalogChildWritePayloadBuilder.buildCastRows(
      movieId,
      details.cast,
    );
    if (castRows.length > 0) {
      await tx.movieCast.createMany({ data: castRows });
    }

    const originCountryRows =
      MovieCatalogChildWritePayloadBuilder.buildOriginCountryRows(
        movieId,
        details.originCountries,
      );
    if (originCountryRows.length > 0) {
      await tx.movieOriginCountry.createMany({ data: originCountryRows });
    }

    const watchProviderRows =
      MovieCatalogChildWritePayloadBuilder.buildWatchProviderRows(
        movieId,
        details.watchProviders,
      );
    if (watchProviderRows.length > 0) {
      await tx.movieWatchProvider.createMany({ data: watchProviderRows });
    }
  }
}
