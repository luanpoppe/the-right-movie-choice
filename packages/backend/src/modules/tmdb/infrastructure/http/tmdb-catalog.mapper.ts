import type {
  MovieCatalogDetails,
  MovieWatchProvider,
} from "../../../../domains/movies/domain/entities/movie-catalog-details.entity";
import type {
  MovieSearchHit,
  MovieSearchPage,
} from "../../../../domains/movies/domain/entities/movie-search.entity";
import { StringUtils } from "../../../../shared/utils/string.utils";
import type { TmdbMovieDetailsResponse } from "./tmdb-movie-details-response.schema";
import type { TmdbSearchResponse } from "./tmdb-search-response.schema";

const DIRECTOR_JOB = "Director";
const CAST_LIMIT = 5;
const YEAR_PREFIX_LENGTH = 4;
const YEAR_FOUR_DIGITS = /^\d{4}$/;

type TmdbSearchMovieResult = TmdbSearchResponse["results"][number];
type TmdbWatchProviderOffer = {
  provider_name: string;
  logo_path: string | null;
};

export class TmdbCatalogMapper {
  static toSearchPage(response: TmdbSearchResponse): MovieSearchPage {
    const results = response.results.map((result) =>
      TmdbCatalogMapper.toSearchHit(result),
    );

    return {
      page: response.page,
      results,
    };
  }

  static toCatalogDetails(
    details: TmdbMovieDetailsResponse,
  ): MovieCatalogDetails {
    const searchHit = TmdbCatalogMapper.toSearchHit({
      id: details.id,
      title: details.title,
      overview: details.overview,
      poster_path: details.poster_path ?? null,
      release_date: details.release_date,
    });
    const genres = TmdbCatalogMapper.mapGenreNames(details.genres);
    const originCountries = details.origin_country ?? [];
    const directors = TmdbCatalogMapper.mapDirectorNames(details.credits?.crew);
    const cast = TmdbCatalogMapper.mapCastNames(details.credits?.cast);
    const watchProviders = TmdbCatalogMapper.mapBrazilWatchProviders(
      details["watch/providers"],
    );
    const imdbId = TmdbCatalogMapper.mapImdbId(details.external_ids?.imdb_id);

    return {
      ...searchHit,
      runtimeMinutes: details.runtime ?? null,
      genres,
      tmdbVoteAverage: details.vote_average ?? null,
      originCountries,
      directors,
      cast,
      watchProviders,
      imdbId,
    };
  }

  static toSearchHit(result: TmdbSearchMovieResult): MovieSearchHit {
    const year = TmdbCatalogMapper.parseYearFromReleaseDate(
      result.release_date,
    );

    return {
      id: result.id,
      title: result.title,
      year,
      posterPath: result.poster_path,
      overview: result.overview,
    };
  }

  static parseYearFromReleaseDate(releaseDate: string): number | null {
    if (StringUtils.isEmptyString(releaseDate)) {
      return null;
    }

    const yearPart = releaseDate.slice(0, YEAR_PREFIX_LENGTH);
    const hasFourDigits = YEAR_FOUR_DIGITS.test(yearPart);
    if (!hasFourDigits) {
      return null;
    }

    return Number(yearPart);
  }

  static mapGenreNames(
    genres: TmdbMovieDetailsResponse["genres"],
  ): string[] {
    if (!genres) {
      return [];
    }

    return genres.map((genre) => genre.name);
  }

  static mapDirectorNames(
    crew: NonNullable<TmdbMovieDetailsResponse["credits"]>["crew"],
  ): string[] {
    if (!crew) {
      return [];
    }

    const directors = crew.filter((member) => member.job === DIRECTOR_JOB);
    return directors.map((member) => member.name);
  }

  static mapCastNames(
    cast: NonNullable<TmdbMovieDetailsResponse["credits"]>["cast"],
  ): string[] {
    if (!cast) {
      return [];
    }

    const firstFive = cast.slice(0, CAST_LIMIT);
    return firstFive.map((member) => member.name);
  }

  static mapBrazilWatchProviders(
    watchProviders: TmdbMovieDetailsResponse["watch/providers"],
  ): MovieCatalogDetails["watchProviders"] {
    const brazil = watchProviders?.results?.BR;
    if (!brazil) {
      return { flatrate: [], rent: [], buy: [] };
    }

    const flatrate = TmdbCatalogMapper.mapWatchOffers(brazil.flatrate);
    const rent = TmdbCatalogMapper.mapWatchOffers(brazil.rent);
    const buy = TmdbCatalogMapper.mapWatchOffers(brazil.buy);

    return { flatrate, rent, buy };
  }

  static mapWatchOffers(
    offers: TmdbWatchProviderOffer[] | undefined,
  ): MovieWatchProvider[] {
    if (!offers) {
      return [];
    }

    return offers.map((offer) => ({
      providerName: offer.provider_name,
      logoPath: offer.logo_path,
    }));
  }

  static mapImdbId(imdbId: string | null | undefined): string | null {
    if (StringUtils.isEmptyString(imdbId)) {
      return null;
    }

    return imdbId;
  }
}
