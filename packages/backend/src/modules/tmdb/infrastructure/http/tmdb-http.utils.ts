import type { MovieDiscoverQuery } from "@/domains/movies/domain/entities/movie-discover-query.entity";
import { StringUtils } from "@/shared/utils/string.utils";
import { TmdbHttpConstants } from "@/modules/tmdb/domain/tmdb-http.constants";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";

export type TmdbFetchFn = typeof globalThis.fetch;

export type TmdbFetchAttempt =
  | { kind: "timeout" }
  | { kind: "ok"; status: number; bodyText: string };

export class TmdbHttpUtils {
  static readonly DETAILS_APPEND_TO_RESPONSE =
    "credits,watch/providers,external_ids";
  static readonly WATCH_REGION = "BR";

  static buildSearchMoviesParams(
    query: string,
    page?: number,
    year?: number,
    language?: string,
  ): URLSearchParams {
    const pageNumber = page ?? 1;
    const catalogLanguage = TmdbHttpUtils.resolveLanguage(language);
    const searchParams = new URLSearchParams();
    searchParams.set("query", query);
    searchParams.set("page", String(pageNumber));
    searchParams.set("language", catalogLanguage);

    const hasYear = year !== undefined;
    if (hasYear) {
      searchParams.set("primary_release_year", String(year));
    }

    return searchParams;
  }

  static buildDiscoverMoviesParams(
    query: MovieDiscoverQuery,
  ): URLSearchParams {
    const pageNumber = query.page ?? 1;
    const catalogLanguage = TmdbHttpUtils.resolveLanguage(query.language);
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(pageNumber));
    searchParams.set("language", catalogLanguage);
    searchParams.set("include_adult", "false");
    searchParams.set("sort_by", "popularity.desc");

    const withGenres = TmdbHttpUtils.joinIdsPipe(query.genres);
    if (withGenres !== undefined) {
      searchParams.set("with_genres", withGenres);
    }

    const withCast = TmdbHttpUtils.joinIdsPipe(query.cast);
    if (withCast !== undefined) {
      searchParams.set("with_cast", withCast);
    }

    const withCrew = TmdbHttpUtils.joinIdsPipe(query.director);
    if (withCrew !== undefined) {
      searchParams.set("with_crew", withCrew);
    }

    const withKeywords = TmdbHttpUtils.joinIdsPipe(query.keyword);
    if (withKeywords !== undefined) {
      searchParams.set("with_keywords", withKeywords);
    }

    const hasMinRating = query.minRating !== undefined;
    if (hasMinRating) {
      searchParams.set("vote_average.gte", String(query.minRating));
    }

    const hasYearFrom = query.yearFrom !== undefined;
    if (hasYearFrom) {
      const releaseDateGte = `${query.yearFrom}-01-01`;
      searchParams.set("primary_release_date.gte", releaseDateGte);
    }

    const hasYearTo = query.yearTo !== undefined;
    if (hasYearTo) {
      const releaseDateLte = `${query.yearTo}-12-31`;
      searchParams.set("primary_release_date.lte", releaseDateLte);
    }

    const hasRuntimeFrom = query.runtimeFrom !== undefined;
    if (hasRuntimeFrom) {
      searchParams.set("with_runtime.gte", String(query.runtimeFrom));
    }

    const hasRuntimeTo = query.runtimeTo !== undefined;
    if (hasRuntimeTo) {
      searchParams.set("with_runtime.lte", String(query.runtimeTo));
    }

    const certificationCountry = query.certificationCountry;
    const certification = query.certification;
    const hasCertificationCountry =
      !StringUtils.isEmptyString(certificationCountry);
    const hasCertification = !StringUtils.isEmptyString(certification);
    const hasBothCertifications = hasCertificationCountry && hasCertification;
    if (hasBothCertifications) {
      searchParams.set("certification_country", certificationCountry);
      searchParams.set("certification", certification);
    }

    return searchParams;
  }

  static buildMovieDetailsParams(language?: string): URLSearchParams {
    const catalogLanguage = TmdbHttpUtils.resolveLanguage(language);
    const searchParams = new URLSearchParams();
    searchParams.set("language", catalogLanguage);
    searchParams.set(
      "append_to_response",
      TmdbHttpUtils.DETAILS_APPEND_TO_RESPONSE,
    );
    searchParams.set("watch_region", TmdbHttpUtils.WATCH_REGION);
    return searchParams;
  }

  static buildRequestUrl(path: string, searchParams: URLSearchParams): string {
    const queryString = searchParams.toString();
    return `${TmdbHttpConstants.API_BASE_URL}${path}?${queryString}`;
  }

  static resolveLanguage(language?: string): string {
    const isLanguageEmpty = StringUtils.isEmptyString(language);
    if (isLanguageEmpty) {
      return TmdbHttpConstants.DEFAULT_LANGUAGE;
    }

    return language;
  }

  static backoffMs(attemptIndex: number): number {
    const backoffExponent = attemptIndex - 1;
    return TmdbHttpConstants.BACKOFF_BASE_MS * 2 ** backoffExponent;
  }

  static assertAccessToken(accessToken: string | undefined): void {
    const isTokenMissing = StringUtils.isEmptyString(accessToken);
    if (!isTokenMissing) return;

    throw new TmdbHttpException("TMDB access token is missing", 500);
  }

  static isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  static throwIfClientMappedError(status: number): void {
    if (status === 401 || status === 400 || status === 422) {
      throw new TmdbHttpException("TMDB request was rejected", 502);
    }
    if (status === 404) {
      throw new TmdbHttpException("TMDB resource not found", 404);
    }
  }

  static parseJsonBody(bodyText: string): unknown {
    try {
      return JSON.parse(bodyText) as unknown;
    } catch {
      throw new TmdbHttpException("TMDB returned invalid JSON", 502);
    }
  }

  static async fetchOnce(
    fetchFn: TmdbFetchFn,
    url: string,
    authorization: string,
  ): Promise<TmdbFetchAttempt> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, TmdbHttpConstants.TIMEOUT_MS);

    try {
      const response = await fetchFn(url, {
        method: "GET",
        headers: { Authorization: authorization },
        signal: abortController.signal,
      });
      const bodyText = await response.text();
      return { kind: "ok", status: response.status, bodyText };
    } catch (error) {
      const isAbortError = TmdbHttpUtils.isAbortError(error);
      if (isAbortError) {
        return { kind: "timeout" };
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static joinIdsPipe(ids: number[] | undefined): string | undefined {
    if (ids === undefined) return undefined;

    const isEmpty = ids.length === 0;
    if (isEmpty) return undefined;

    return ids.join("|");
  }

  private static isAbortError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const isAbortName = error.name === "AbortError";
    const isTimeoutName = error.name === "TimeoutError";
    return isAbortName || isTimeoutName;
  }
}
