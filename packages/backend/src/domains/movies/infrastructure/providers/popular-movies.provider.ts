import type { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { IPopularMoviesProvider } from "@/domains/movies/application/providers/popular-movies.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { PopularMoviesConstants } from "@/domains/movies/domain/popular-movies.constants";
import { Logger } from "@/lib/logger/logger";
import { Redis } from "@/lib/redis/redis";
import { ErrorUtils } from "@/shared/utils/error.utils";

import type { MovieCatalogDetailsResolver } from "./movie-catalog-details.resolver";

export class PopularMoviesProvider implements IPopularMoviesProvider {
  constructor(
    private readonly redis: Redis,
    private readonly catalog: IMovieCatalogProvider,
    private readonly detailsResolver: MovieCatalogDetailsResolver,
  ) {}

  async getPopularMovies(language?: string): Promise<MovieCatalogDetails[]> {
    const lang = language ?? PopularMoviesConstants.DEFAULT_LANGUAGE;
    const cacheKey = PopularMoviesConstants.cacheKey(lang);

    const cachedMovies = await this.readCache(cacheKey);
    const hasCachedMovies = cachedMovies !== null;
    if (hasCachedMovies) {
      return cachedMovies;
    }

    return this.refreshPopularMovies(lang);
  }

  async refreshPopularMovies(language?: string): Promise<MovieCatalogDetails[]> {
    const lang = language ?? PopularMoviesConstants.DEFAULT_LANGUAGE;
    const cacheKey = PopularMoviesConstants.cacheKey(lang);

    const freshMovies = await this.buildPopularMovies(lang);
    const hasMovies = freshMovies.length > 0;
    if (hasMovies) {
      await this.writeCache(cacheKey, freshMovies);
    }

    return freshMovies;
  }

  private async buildPopularMovies(lang: string): Promise<MovieCatalogDetails[]> {
    try {
      const page = await this.catalog.discoverMovies({
        page: 1,
        language: lang,
      });
      const candidates = page.results.slice(
        0,
        PopularMoviesConstants.CANDIDATE_POOL,
      );

      const resolvedCandidates = await Promise.all(
        candidates.map((hit) => this.resolveDetailsSafely(hit.id, lang)),
      );
      const resolvedMovies = resolvedCandidates.filter(
        (movie): movie is MovieCatalogDetails => movie !== null,
      );

      return resolvedMovies.slice(0, PopularMoviesConstants.COUNT);
    } catch (error) {
      Logger.warn("Popular movies build failed, serving empty list", {
        reason: ErrorUtils.message(error),
      });
      return [];
    }
  }

  private async resolveDetailsSafely(
    tmdbId: number,
    lang: string,
  ): Promise<MovieCatalogDetails | null> {
    try {
      return await this.detailsResolver.resolveByTmdbId(tmdbId, lang);
    } catch (error) {
      Logger.warn("Popular movie details resolution failed", {
        tmdbId,
        reason: ErrorUtils.message(error),
      });
      return null;
    }
  }

  private async readCache(
    cacheKey: string,
  ): Promise<MovieCatalogDetails[] | null> {
    try {
      const rawValue = await this.redis.getString(cacheKey);
      const isCacheEmpty = rawValue === null || rawValue === "";
      if (isCacheEmpty) {
        return null;
      }

      const parsedValue = JSON.parse(rawValue) as unknown;
      const isList = Array.isArray(parsedValue);
      if (!isList) {
        return null;
      }

      Logger.debug("Popular movies served from cache", {
        count: parsedValue.length,
      });
      return parsedValue as MovieCatalogDetails[];
    } catch (error) {
      Logger.warn("Popular movies cache read failed", {
        reason: ErrorUtils.message(error),
      });
      return null;
    }
  }

  private async writeCache(
    cacheKey: string,
    movies: MovieCatalogDetails[],
  ): Promise<void> {
    try {
      await this.redis.setWithExpiration(
        cacheKey,
        movies,
        PopularMoviesConstants.CACHE_TTL_SECONDS,
      );
      Logger.debug("Popular movies cache written", { count: movies.length });
    } catch (error) {
      Logger.warn("Popular movies cache write failed", {
        reason: ErrorUtils.message(error),
      });
    }
  }
}
