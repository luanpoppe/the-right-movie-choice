import { StringUtils } from "@/shared/utils/string.utils";
import type { MovieDiscoverQuery } from "./entities/movie-discover-query.entity";
import {
  MovieCatalogSearchConstants,
  MovieCatalogSearchValidationException,
} from "./movie-catalog-search.constants";

export class MovieDiscoverValidationUtils {
  static readonly MIN_RATING = 0;
  static readonly MAX_RATING = 10;

  static assertValidQuery(query: MovieDiscoverQuery): void {
    MovieDiscoverValidationUtils.assertValidLanguage(query.language);
    MovieDiscoverValidationUtils.assertValidPage(query.page);
    MovieDiscoverValidationUtils.assertValidMinRating(query.minRating);
    MovieDiscoverValidationUtils.assertValidYearRange(query.yearFrom, query.yearTo);
    MovieDiscoverValidationUtils.assertValidRuntimeRange(
      query.runtimeFrom,
      query.runtimeTo,
    );
    MovieDiscoverValidationUtils.assertValidCertification(
      query.certificationCountry,
      query.certification,
    );
    MovieDiscoverValidationUtils.assertValidIdList(query.genres, "genres");
    MovieDiscoverValidationUtils.assertValidIdList(query.cast, "cast");
    MovieDiscoverValidationUtils.assertValidIdList(query.director, "director");
    MovieDiscoverValidationUtils.assertValidIdList(query.keyword, "keyword");
  }

  static assertValidLanguage(language?: string): void {
    MovieCatalogSearchConstants.resolveLanguage(language);
  }

  static assertValidPage(page?: number): void {
    if (page === undefined) {
      return;
    }

    const isValidPage = Number.isInteger(page) && page >= 1;
    if (isValidPage) {
      return;
    }

    throw new MovieCatalogSearchValidationException(
      `page must be an integer >= 1, received ${page}`,
    );
  }

  static assertValidMinRating(minRating?: number): void {
    if (minRating === undefined) {
      return;
    }

    const isInRange =
      Number.isFinite(minRating) &&
      minRating >= MovieDiscoverValidationUtils.MIN_RATING &&
      minRating <= MovieDiscoverValidationUtils.MAX_RATING;
    if (isInRange) {
      return;
    }

    throw new MovieCatalogSearchValidationException(
      `minRating must be between ${MovieDiscoverValidationUtils.MIN_RATING} and ${MovieDiscoverValidationUtils.MAX_RATING}, received ${minRating}`,
    );
  }

  static assertValidYearRange(yearFrom?: number, yearTo?: number): void {
    MovieDiscoverValidationUtils.assertPositiveInteger(yearFrom, "yearFrom");
    MovieDiscoverValidationUtils.assertPositiveInteger(yearTo, "yearTo");

    const hasBothYears = yearFrom !== undefined && yearTo !== undefined;
    if (!hasBothYears) {
      return;
    }

    const isInvertedRange = yearFrom > yearTo;
    if (isInvertedRange) {
      throw new MovieCatalogSearchValidationException(
        `yearFrom must not be greater than yearTo, received ${yearFrom} and ${yearTo}`,
      );
    }
  }

  static assertValidRuntimeRange(
    runtimeFrom?: number,
    runtimeTo?: number,
  ): void {
    MovieDiscoverValidationUtils.assertPositiveInteger(
      runtimeFrom,
      "runtimeFrom",
    );
    MovieDiscoverValidationUtils.assertPositiveInteger(runtimeTo, "runtimeTo");

    const hasBothRuntimes = runtimeFrom !== undefined && runtimeTo !== undefined;
    if (!hasBothRuntimes) {
      return;
    }

    const isInvertedRange = runtimeFrom > runtimeTo;
    if (isInvertedRange) {
      throw new MovieCatalogSearchValidationException(
        `runtimeFrom must not be greater than runtimeTo, received ${runtimeFrom} and ${runtimeTo}`,
      );
    }
  }

  static assertValidCertification(
    certificationCountry?: string,
    certification?: string,
  ): void {
    const hasCountry = !StringUtils.isEmptyString(certificationCountry);
    const hasCertification = !StringUtils.isEmptyString(certification);

    const areBothPresent = hasCountry && hasCertification;
    const areBothAbsent = !hasCountry && !hasCertification;
    const isConsistent = areBothPresent || areBothAbsent;
    if (isConsistent) {
      return;
    }

    throw new MovieCatalogSearchValidationException(
      "certificationCountry and certification must be provided together or not at all",
    );
  }

  static assertValidIdList(ids: number[] | undefined, fieldName: string): void {
    if (ids === undefined) {
      return;
    }

    for (const id of ids) {
      MovieDiscoverValidationUtils.assertPositiveInteger(id, fieldName);
    }
  }

  static assertPositiveInteger(value: number | undefined, fieldName: string): void {
    if (value === undefined) {
      return;
    }

    const isPositiveInteger = Number.isInteger(value) && value > 0;
    if (isPositiveInteger) {
      return;
    }

    throw new MovieCatalogSearchValidationException(
      `${fieldName} must be a positive integer, received ${value}`,
    );
  }
}
