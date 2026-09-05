import type {
  MovieCatalogDetails,
  MovieWatchProvider,
} from "../../domain/entities/movie-catalog-details.entity";
import {
  MovieWatchProviderKind,
  type Movie,
  type MovieCast,
  type MovieDirector,
  type MovieGenre,
  type MovieOriginCountry,
  type MovieWatchProvider as PrismaMovieWatchProvider,
} from "../../../../../generated/prisma/client.js";

type MovieWithChildren = Movie & {
  genres: MovieGenre[];
  directors: MovieDirector[];
  cast: MovieCast[];
  originCountries: MovieOriginCountry[];
  watchProviders: PrismaMovieWatchProvider[];
};

export class MovieCatalogPrismaMapper {
  static toDetails(movieWithChildren: MovieWithChildren): MovieCatalogDetails {
    const genres = MovieCatalogPrismaMapper.mapGenreNames(movieWithChildren.genres);
    const directors = MovieCatalogPrismaMapper.mapDirectorNames(
      movieWithChildren.directors,
    );
    const cast = MovieCatalogPrismaMapper.mapCastNames(movieWithChildren.cast);
    const originCountries = MovieCatalogPrismaMapper.mapOriginCountryCodes(
      movieWithChildren.originCountries,
    );
    const watchProviders = MovieCatalogPrismaMapper.mapWatchProviders(
      movieWithChildren.watchProviders,
    );
    const tmdbId = movieWithChildren.tmdbId;

    return {
      tmdbId,
      title: movieWithChildren.title,
      year: movieWithChildren.year,
      posterPath: movieWithChildren.posterPath,
      overview: movieWithChildren.overview,
      runtimeMinutes: movieWithChildren.runtimeMinutes,
      genres,
      tmdbVoteAverage: movieWithChildren.tmdbVoteAverage,
      originCountries,
      directors,
      cast,
      watchProviders,
      imdbId: movieWithChildren.imdbId,
    };
  }

  static mapGenreNames(genres: MovieGenre[]): string[] {
    return genres.map((genre) => genre.name);
  }

  static mapDirectorNames(directors: MovieDirector[]): string[] {
    return directors.map((director) => director.name);
  }

  static mapCastNames(cast: MovieCast[]): string[] {
    const sortedCast = [...cast].sort(MovieCatalogPrismaMapper.compareCastMembers);
    return sortedCast.map((member) => member.name);
  }

  static mapOriginCountryCodes(
    originCountries: MovieOriginCountry[],
  ): string[] {
    return originCountries.map((country) => country.code);
  }

  static mapWatchProviders(
    watchProviders: PrismaMovieWatchProvider[],
  ): MovieCatalogDetails["watchProviders"] {
    const flatrate = MovieCatalogPrismaMapper.mapWatchProvidersByKind(
      watchProviders,
      MovieWatchProviderKind.flatrate,
    );
    const rent = MovieCatalogPrismaMapper.mapWatchProvidersByKind(
      watchProviders,
      MovieWatchProviderKind.rent,
    );
    const buy = MovieCatalogPrismaMapper.mapWatchProvidersByKind(
      watchProviders,
      MovieWatchProviderKind.buy,
    );

    return { flatrate, rent, buy };
  }

  static mapWatchProvidersByKind(
    watchProviders: PrismaMovieWatchProvider[],
    kind: (typeof MovieWatchProviderKind)[keyof typeof MovieWatchProviderKind],
  ): MovieWatchProvider[] {
    const filtered = watchProviders.filter((provider) => provider.kind === kind);
    return filtered.map(MovieCatalogPrismaMapper.toWatchProvider);
  }

  static toWatchProvider(
    provider: PrismaMovieWatchProvider,
  ): MovieWatchProvider {
    return {
      providerName: provider.providerName,
      logoPath: provider.logoPath,
    };
  }

  private static compareCastMembers(left: MovieCast, right: MovieCast): number {
    const sortOrderDiff = left.sortOrder - right.sortOrder;
    if (sortOrderDiff !== 0) {
      return sortOrderDiff;
    }

    return left.name.localeCompare(right.name);
  }
}
