import { env } from "@/env";
import { Logger } from "@/lib/logger/logger";
import { DelayUtils } from "@/shared/utils/delay.utils";
import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieSearchPage } from "@/domains/movies/domain/entities/movie-search.entity";
import { TmdbHttpConstants } from "@/modules/tmdb/domain/tmdb-http.constants";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";
import { TmdbCatalogMapper } from "@/modules/tmdb/infrastructure/http/tmdb-catalog.mapper";
import { TmdbMovieDetailsResponseSchema } from "@/modules/tmdb/infrastructure/http/tmdb-movie-details-response.schema";
import { TmdbSearchResponseSchema } from "@/modules/tmdb/infrastructure/http/tmdb-search-response.schema";
import {
  TmdbFetchFn,
  TmdbHttpUtils,
} from "@/modules/tmdb/infrastructure/http/tmdb-http.utils";

type DelayFn = (ms: number) => Promise<void>;

export type TmdbHttpClientParams = {
  fetch?: TmdbFetchFn;
  accessToken?: string;
  delay?: DelayFn;
};

export class TmdbHttpClient implements IMovieCatalogProvider {
  private readonly fetchFn: TmdbFetchFn;
  private readonly accessToken: string | undefined;
  private readonly delay: DelayFn;

  constructor(params: TmdbHttpClientParams = {}) {
    this.fetchFn = params.fetch ?? globalThis.fetch.bind(globalThis);
    this.accessToken = params.accessToken ?? env.TMDB_ACCESS_TOKEN;
    this.delay = params.delay ?? DelayUtils.delay;
  }

  async searchMovies(
    query: string,
    page?: number,
    year?: number,
    language?: string,
  ): Promise<MovieSearchPage> {
    const searchParams = TmdbHttpUtils.buildSearchMoviesParams(
      query,
      page,
      year,
      language,
    );
    const json = await this.getJson("/search/movie", searchParams);
    return this.mapSearchPage(json);
  }

  async getMovieDetails(
    movieId: number,
    language?: string,
  ): Promise<MovieCatalogDetails> {
    const searchParams = TmdbHttpUtils.buildMovieDetailsParams(language);
    const path = `/movie/${movieId}`;
    const json = await this.getJson(path, searchParams);
    return this.mapCatalogDetails(json);
  }

  private async getJson(
    path: string,
    searchParams: URLSearchParams,
  ): Promise<unknown> {
    TmdbHttpUtils.assertAccessToken(this.accessToken);

    const url = TmdbHttpUtils.buildRequestUrl(path, searchParams);
    const maxAttempts = TmdbHttpConstants.MAX_RETRIES + 1;
    const authorization = `Bearer ${this.accessToken}`;

    for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
      const shouldWaitBeforeAttempt = attemptIndex > 0;
      if (shouldWaitBeforeAttempt) {
        const backoffMs = TmdbHttpUtils.backoffMs(attemptIndex);
        await this.delay(backoffMs);
      }

      const startedAtMs = Date.now();
      const attemptResult = await TmdbHttpUtils.fetchOnce(
        this.fetchFn,
        url,
        authorization,
      );
      const latencyMs = Date.now() - startedAtMs;
      const isLastAttempt = attemptIndex === maxAttempts - 1;

      const isTimeout = attemptResult.kind === "timeout";
      if (isTimeout) {
        Logger.warn("TMDB request timed out", {
          method: "GET",
          path,
          latencyMs,
        });
      }
      const shouldFailTimeout = isTimeout && isLastAttempt;
      if (shouldFailTimeout) {
        throw new TmdbHttpException("TMDB request timed out", 504);
      }
      if (isTimeout) continue;

      const status = attemptResult.status;
      Logger.info("TMDB request completed", {
        method: "GET",
        path,
        status,
        latencyMs,
      });

      const isRetryableStatus = TmdbHttpUtils.isRetryableStatus(status);
      const shouldFailAfterRetries = isRetryableStatus && isLastAttempt;

      if (shouldFailAfterRetries) {
        throw new TmdbHttpException("TMDB upstream unavailable", 503);
      }
      if (isRetryableStatus) continue;

      TmdbHttpUtils.throwIfClientMappedError(status);

      const isSuccess = status >= 200 && status < 300;
      if (!isSuccess) {
        throw new TmdbHttpException("TMDB request failed", 502);
      }

      return TmdbHttpUtils.parseJsonBody(attemptResult.bodyText);
    }

    throw new TmdbHttpException("TMDB request failed", 502);
  }

  private mapSearchPage(json: unknown): MovieSearchPage {
    const parsed = TmdbSearchResponseSchema.safeParse(json);
    if (!parsed.success) {
      Logger.warn("TMDB returned an unexpected payload", { path: "search" });
      throw new TmdbHttpException("TMDB returned an unexpected payload", 502);
    }

    return TmdbCatalogMapper.toSearchPage(parsed.data);
  }

  private mapCatalogDetails(json: unknown): MovieCatalogDetails {
    const parsed = TmdbMovieDetailsResponseSchema.safeParse(json);
    if (!parsed.success) {
      Logger.warn("TMDB returned an unexpected payload", { path: "details" });
      throw new TmdbHttpException("TMDB returned an unexpected payload", 502);
    }

    return TmdbCatalogMapper.toCatalogDetails(parsed.data);
  }
}
