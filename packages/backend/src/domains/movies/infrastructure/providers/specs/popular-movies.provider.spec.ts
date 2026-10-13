import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { PopularMoviesConstants } from "@/domains/movies/domain/popular-movies.constants";
import { Redis } from "@/lib/redis/redis";
import type { MovieCatalogDetailsResolver } from "../movie-catalog-details.resolver";
import { PopularMoviesProvider } from "../popular-movies.provider";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class PopularMoviesFixtures {
  static details(tmdbId: number): MovieCatalogDetails {
    return {
      tmdbId,
      title: `Movie ${tmdbId}`,
      year: 2010,
      posterPath: "/poster.jpg",
      overview: "Overview",
      runtimeMinutes: 120,
      genres: ["Drama"],
      tmdbVoteAverage: 8.1,
      originCountries: ["US"],
      directors: ["Director"],
      cast: ["Actor"],
      watchProviders: { flatrate: [], rent: [], buy: [] },
      imdbId: "tt0000000",
    };
  }
}

describe("PopularMoviesProvider", () => {
  const lang = PopularMoviesConstants.DEFAULT_LANGUAGE;

  let redis: Redis;
  let catalog: IMovieCatalogProvider;
  let resolver: MovieCatalogDetailsResolver;
  let provider: PopularMoviesProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    redis = {
      getString: vi.fn(),
      setWithExpiration: vi.fn().mockResolvedValue(undefined),
    } as unknown as Redis;

    catalog = {
      discoverMovies: vi.fn(),
    } as unknown as IMovieCatalogProvider;

    resolver = {
      resolveByTmdbId: vi.fn(),
    } as unknown as MovieCatalogDetailsResolver;

    provider = new PopularMoviesProvider(redis, catalog, resolver);
  });

  it("devolve o cache quando presente, sem consultar o catálogo", async () => {
    const cached = [PopularMoviesFixtures.details(1)];
    vi.mocked(redis.getString).mockResolvedValue(JSON.stringify(cached));

    const result = await provider.getPopularMovies(lang);

    expect(result).toEqual(cached);
    expect(catalog.discoverMovies).not.toHaveBeenCalled();
  });

  it("em cache miss, descobre populares, resolve detalhes e grava o cache", async () => {
    vi.mocked(redis.getString).mockResolvedValue(null);
    vi.mocked(catalog.discoverMovies).mockResolvedValue({
      page: 1,
      results: Array.from({ length: PopularMoviesConstants.COUNT }, (_, index) => ({
        id: index + 1,
        title: `Movie ${index + 1}`,
        year: 2010,
        posterPath: "/poster.jpg",
        overview: "Overview",
        tmdbVoteAverage: null,
      })),
    });
    vi.mocked(resolver.resolveByTmdbId).mockImplementation(async (id) =>
      PopularMoviesFixtures.details(id),
    );

    const result = await provider.getPopularMovies(lang);

    expect(result).toHaveLength(PopularMoviesConstants.COUNT);
    expect(catalog.discoverMovies).toHaveBeenCalledWith({
      page: 1,
      language: lang,
    });
    expect(redis.setWithExpiration).toHaveBeenCalledWith(
      PopularMoviesConstants.cacheKey(lang),
      expect.any(Array),
      PopularMoviesConstants.CACHE_TTL_SECONDS,
    );
  });

  it("ignora candidatos cujo detalhe falha, mantendo os resolvidos", async () => {
    vi.mocked(redis.getString).mockResolvedValue(null);
    vi.mocked(catalog.discoverMovies).mockResolvedValue({
      page: 1,
      results: Array.from({ length: PopularMoviesConstants.COUNT }, (_, index) => ({
        id: index + 1,
        title: `Movie ${index + 1}`,
        year: 2010,
        posterPath: null,
        overview: "Overview",
        tmdbVoteAverage: null,
      })),
    });
    vi.mocked(resolver.resolveByTmdbId).mockImplementation(async (id) => {
      if (id === 1) {
        throw new Error("tmdb down");
      }
      return PopularMoviesFixtures.details(id);
    });

    const result = await provider.getPopularMovies(lang);

    expect(result).toHaveLength(PopularMoviesConstants.COUNT - 1);
    expect(result.some((movie) => movie.tmdbId === 1)).toBe(false);
  });

  it("devolve lista vazia e não grava cache quando o catálogo falha", async () => {
    vi.mocked(redis.getString).mockResolvedValue(null);
    vi.mocked(catalog.discoverMovies).mockRejectedValue(new Error("tmdb down"));

    const result = await provider.getPopularMovies(lang);

    expect(result).toEqual([]);
    expect(redis.setWithExpiration).not.toHaveBeenCalled();
  });

  it("refreshPopularMovies ignora o cache e reconstrói", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({
      page: 1,
      results: [{ id: 1, title: "Movie 1", year: 2010, posterPath: null, overview: "", tmdbVoteAverage: null }],
    });
    vi.mocked(resolver.resolveByTmdbId).mockResolvedValue(
      PopularMoviesFixtures.details(1),
    );

    const result = await provider.refreshPopularMovies(lang);

    expect(redis.getString).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(redis.setWithExpiration).toHaveBeenCalledTimes(1);
  });
});
