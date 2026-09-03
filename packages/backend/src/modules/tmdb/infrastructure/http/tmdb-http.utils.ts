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
  ): URLSearchParams {
    const pageNumber = page ?? 1;
    const searchParams = new URLSearchParams();
    searchParams.set("query", query);
    searchParams.set("page", String(pageNumber));
    searchParams.set("language", TmdbHttpConstants.DEFAULT_LANGUAGE);
    return searchParams;
  }

  static buildMovieDetailsParams(): URLSearchParams {
    const searchParams = new URLSearchParams();
    searchParams.set("language", TmdbHttpConstants.DEFAULT_LANGUAGE);
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

  private static isAbortError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const isAbortName = error.name === "AbortError";
    const isTimeoutName = error.name === "TimeoutError";
    return isAbortName || isTimeoutName;
  }
}
