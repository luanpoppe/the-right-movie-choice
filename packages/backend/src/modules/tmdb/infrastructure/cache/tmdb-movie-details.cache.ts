import { Logger } from "@/lib/logger/logger";
import { Redis } from "@/lib/redis/redis";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { TmdbCacheConstants } from "@/modules/tmdb/domain/tmdb-cache.constants";

export class TmdbMovieDetailsCache {
  constructor(private redis: Redis) {}

  buildKey(movieId: number, lang?: string): string {
    return TmdbCacheConstants.buildKey(movieId, lang);
  }

  async get(
    movieId: number,
    lang?: string,
  ): Promise<MovieCatalogDetails | null> {
    const key = this.buildKey(movieId, lang);

    try {
      const rawValue = await this.redis.getString(key);
      return this.parseCachedDetails(movieId, rawValue);
    } catch (error) {
      this.logCacheFailure("get", movieId, error);
      return null;
    }
  }

  async set(
    movieId: number,
    details: MovieCatalogDetails,
    lang?: string,
  ): Promise<void> {
    const key = this.buildKey(movieId, lang);
    const ttlSeconds = TmdbCacheConstants.DETAILS_TTL_SECONDS;

    try {
      await this.redis.setWithExpiration(key, details, ttlSeconds);
      Logger.debug("TMDB movie details cache written", { movieId });
    } catch (error) {
      this.logCacheFailure("set", movieId, error);
    }
  }

  private parseCachedDetails(
    movieId: number,
    rawValue: string | null,
  ): MovieCatalogDetails | null {
    if (rawValue === null || rawValue === "") {
      Logger.debug("TMDB movie details cache miss", { movieId });
      return null;
    }

    const parsedValue = this.parseJson(rawValue);
    if (parsedValue === null) {
      Logger.warn("TMDB movie details cache has invalid JSON", { movieId });
      return null;
    }

    const isDetailsShape = this.hasDetailsShape(parsedValue);
    if (!isDetailsShape) {
      Logger.warn("TMDB movie details cache has unexpected shape", { movieId });
      return null;
    }

    Logger.debug("TMDB movie details cache hit", { movieId });
    return parsedValue;
  }

  private parseJson(rawValue: string): unknown | null {
    try {
      return JSON.parse(rawValue);
    } catch {
      return null;
    }
  }

  private hasDetailsShape(value: unknown): value is MovieCatalogDetails {
    if (typeof value !== "object" || value === null) return false;
    if (Array.isArray(value)) return false;

    const candidate = value as Partial<MovieCatalogDetails>;
    return typeof candidate.tmdbId === "number" && typeof candidate.title === "string";
  }

  private logCacheFailure(
    operation: string,
    movieId: number,
    error: unknown,
  ): void {
    const reason = error instanceof Error ? error.message : "unknown";
    Logger.warn("TMDB movie details cache failed", {
      operation,
      movieId,
      reason,
    });
  }
}
