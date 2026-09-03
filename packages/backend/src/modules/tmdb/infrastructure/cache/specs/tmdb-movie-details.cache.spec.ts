import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { Redis } from "@/lib/redis/redis";
import { TmdbCacheConstants } from "@/modules/tmdb/domain/tmdb-cache.constants";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";

const DETAILS: MovieCatalogDetails = {
  id: 11,
  title: "Star Wars",
  year: 1977,
  posterPath: "/poster.jpg",
  overview: "A long time ago",
  runtimeMinutes: 121,
  genres: ["Adventure"],
  tmdbVoteAverage: 8.2,
  originCountries: ["US"],
  directors: ["George Lucas"],
  cast: ["Mark Hamill"],
  watchProviders: { flatrate: [], rent: [], buy: [] },
  imdbId: "tt0076759",
};

function createCache() {
  const redis = {
    getString: vi.fn(),
    setWithExpiration: vi.fn(),
  };

  const cache = new TmdbMovieDetailsCache(redis as unknown as Redis);

  return { cache, redis };
}

describe("TmdbMovieDetailsCache", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed DTO on cache hit and does not call setWithExpiration", async () => {
    const { cache, redis } = createCache();
    redis.getString.mockResolvedValue(JSON.stringify(DETAILS));

    const result = await cache.get(11);

    expect(result).toEqual(DETAILS);
    expect(redis.getString).toHaveBeenCalledTimes(1);
    expect(redis.getString).toHaveBeenCalledWith(
      TmdbCacheConstants.buildKey(11),
    );
    expect(redis.setWithExpiration).not.toHaveBeenCalled();
  });

  it("writes DTO with TTL 86400 seconds", async () => {
    const { cache, redis } = createCache();
    redis.setWithExpiration.mockResolvedValue(undefined);

    await cache.set(11, DETAILS);

    expect(redis.setWithExpiration).toHaveBeenCalledTimes(1);
    expect(redis.setWithExpiration).toHaveBeenCalledWith(
      TmdbCacheConstants.buildKey(11),
      DETAILS,
      86_400,
    );
  });

  it("returns null when getString throws and does not rethrow", async () => {
    const { cache, redis } = createCache();
    redis.getString.mockRejectedValue(new Error("redis down"));

    const result = await cache.get(11);

    expect(result).toBeNull();
    expect(redis.setWithExpiration).not.toHaveBeenCalled();
  });

  it("uses getString for reads, not Redis.get", async () => {
    const { cache, redis } = createCache();
    redis.getString.mockResolvedValue(null);

    await cache.get(11);

    expect(redis.getString).toHaveBeenCalledTimes(1);
    expect(Object.keys(redis)).toEqual(["getString", "setWithExpiration"]);
  });

  it("returns null on miss, empty string, invalid JSON or unexpected shape", async () => {
    const { cache, redis } = createCache();

    redis.getString.mockResolvedValueOnce(null);
    expect(await cache.get(11)).toBeNull();

    redis.getString.mockResolvedValueOnce("");
    expect(await cache.get(11)).toBeNull();

    redis.getString.mockResolvedValueOnce("{not-json");
    expect(await cache.get(11)).toBeNull();

    redis.getString.mockResolvedValueOnce(JSON.stringify({ id: "11" }));
    expect(await cache.get(11)).toBeNull();
  });

  it("does not throw when setWithExpiration fails", async () => {
    const { cache, redis } = createCache();
    redis.setWithExpiration.mockRejectedValue(new Error("redis down"));

    await expect(cache.set(11, DETAILS)).resolves.toBeUndefined();
  });
});
