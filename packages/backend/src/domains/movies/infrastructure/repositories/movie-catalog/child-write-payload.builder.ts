import type {
  MovieCatalogDetails,
  MovieWatchProvider,
} from "../../../domain/entities/movie-catalog-details.entity";
import { MovieWatchProviderKind } from "../../../../../../generated/prisma/client.js";

type MovieGenreCreateRow = { movieId: number; name: string };
type MovieDirectorCreateRow = { movieId: number; name: string };
type MovieCastCreateRow = { movieId: number; name: string; sortOrder: number };
type MovieOriginCountryCreateRow = { movieId: number; code: string };
type MovieWatchProviderCreateRow = {
  movieId: number;
  kind: (typeof MovieWatchProviderKind)[keyof typeof MovieWatchProviderKind];
  providerName: string;
  logoPath: string | null;
};

export class MovieCatalogChildWritePayloadBuilder {
  static buildGenreRows(movieId: number, genres: string[]): MovieGenreCreateRow[] {
    const rows: MovieGenreCreateRow[] = [];

    for (const name of genres) {
      rows.push({ movieId, name });
    }

    return rows;
  }

  static buildDirectorRows(
    movieId: number,
    directors: string[],
  ): MovieDirectorCreateRow[] {
    const rows: MovieDirectorCreateRow[] = [];

    for (const name of directors) {
      rows.push({ movieId, name });
    }

    return rows;
  }

  static buildCastRows(movieId: number, cast: string[]): MovieCastCreateRow[] {
    const rows: MovieCastCreateRow[] = [];

    for (const name of cast) {
      const sortOrder = rows.length;
      rows.push({ movieId, name, sortOrder });
    }

    return rows;
  }

  static buildOriginCountryRows(
    movieId: number,
    originCountries: string[],
  ): MovieOriginCountryCreateRow[] {
    const rows: MovieOriginCountryCreateRow[] = [];

    for (const code of originCountries) {
      rows.push({ movieId, code });
    }

    return rows;
  }

  static buildWatchProviderRows(
    movieId: number,
    watchProviders: MovieCatalogDetails["watchProviders"],
  ): MovieWatchProviderCreateRow[] {
    const flatrateRows = MovieCatalogChildWritePayloadBuilder.buildWatchProviderRowsForKind(
      movieId,
      watchProviders.flatrate,
      MovieWatchProviderKind.flatrate,
    );
    const rentRows = MovieCatalogChildWritePayloadBuilder.buildWatchProviderRowsForKind(
      movieId,
      watchProviders.rent,
      MovieWatchProviderKind.rent,
    );
    const buyRows = MovieCatalogChildWritePayloadBuilder.buildWatchProviderRowsForKind(
      movieId,
      watchProviders.buy,
      MovieWatchProviderKind.buy,
    );

    const rows: MovieWatchProviderCreateRow[] = [];
    rows.push(...flatrateRows);
    rows.push(...rentRows);
    rows.push(...buyRows);

    return rows;
  }

  private static buildWatchProviderRowsForKind(
    movieId: number,
    providers: MovieWatchProvider[],
    kind: (typeof MovieWatchProviderKind)[keyof typeof MovieWatchProviderKind],
  ): MovieWatchProviderCreateRow[] {
    const rows: MovieWatchProviderCreateRow[] = [];

    for (const provider of providers) {
      rows.push({
        movieId,
        kind,
        providerName: provider.providerName,
        logoPath: provider.logoPath,
      });
    }

    return rows;
  }
}
