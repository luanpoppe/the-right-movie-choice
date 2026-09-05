import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { MovieCatalogFreshnessUtils } from "@/domains/movies/domain/movie-catalog-freshness.utils";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  IMovieCatalogRepository,
  MovieCatalogStoredRecord,
} from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { Logger } from "@/lib/logger/logger";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import { MovieCatalogDetailsResolver } from "../movie-catalog-details.resolver";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class MovieCatalogDetailsResolverFixtures {
  static details(overrides: Partial<MovieCatalogDetails> = {}): MovieCatalogDetails {
    return {
      tmdbId: 157336,
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Sinopse completa",
      runtimeMinutes: 169,
      genres: ["Ficção científica"],
      tmdbVoteAverage: 8.4,
      originCountries: ["US"],
      directors: ["Christopher Nolan"],
      cast: ["Matthew McConaughey"],
      watchProviders: {
        flatrate: [],
        rent: [],
        buy: [],
      },
      imdbId: "tt0816692",
      ...overrides,
    };
  }

  static storedRecord(
    details: MovieCatalogDetails,
    updatedAt: Date,
  ): MovieCatalogStoredRecord {
    return {
      details,
      updatedAt,
    };
  }

  static freshUpdatedAt(now: Date): Date {
    const freshForMs = MovieCatalogFreshnessUtils.FRESH_FOR_MS;
    const updatedAtMs = now.getTime() - freshForMs + 1;
    return new Date(updatedAtMs);
  }

  static staleUpdatedAt(now: Date): Date {
    const freshForMs = MovieCatalogFreshnessUtils.FRESH_FOR_MS;
    const updatedAtMs = now.getTime() - freshForMs;
    return new Date(updatedAtMs);
  }
}

describe("MovieCatalogDetailsResolver", () => {
  const tmdbId = 157336;
  const lang = DEFAULT_MOVIE_CATALOG_LANGUAGE;
  const now = new Date("2026-09-05T12:00:00.000Z");

  let cache: TmdbMovieDetailsCache;
  let repository: IMovieCatalogRepository;
  let catalog: IMovieCatalogProvider;
  let resolver: MovieCatalogDetailsResolver;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    cache = {
      get: vi.fn(),
      set: vi.fn(),
      buildKey: vi.fn(),
    } as unknown as TmdbMovieDetailsCache;

    repository = {
      upsert: vi.fn(),
      findByTmdbId: vi.fn(),
      findByTitleAndYear: vi.fn(),
    };

    catalog = {
      searchMovies: vi.fn(),
      getMovieDetails: vi.fn(),
    };

    resolver = new MovieCatalogDetailsResolver(cache, repository, catalog);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redis hit: devolve cache imediatamente sem consultar banco ou TMDB", async () => {
    const cachedDetails = MovieCatalogDetailsResolverFixtures.details();
    vi.mocked(cache.get).mockResolvedValue(cachedDetails);

    const result = await resolver.resolveByTmdbId(tmdbId);

    expect(result).toBe(cachedDetails);
    expect(cache.get).toHaveBeenCalledWith(tmdbId, lang);
    expect(repository.findByTmdbId).not.toHaveBeenCalled();
    expect(catalog.getMovieDetails).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it("fresh db: aquece Redis e devolve ficha local", async () => {
    const localDetails = MovieCatalogDetailsResolverFixtures.details();
    const updatedAt = MovieCatalogDetailsResolverFixtures.freshUpdatedAt(now);
    const localRecord = MovieCatalogDetailsResolverFixtures.storedRecord(
      localDetails,
      updatedAt,
    );

    vi.mocked(cache.get).mockResolvedValue(null);
    vi.mocked(repository.findByTmdbId).mockResolvedValue(localRecord);

    const result = await resolver.resolveByTmdbId(tmdbId);

    expect(result).toBe(localDetails);
    expect(repository.findByTmdbId).toHaveBeenCalledWith(tmdbId, lang);
    expect(cache.set).toHaveBeenCalledWith(tmdbId, localDetails, lang);
    expect(catalog.getMovieDetails).not.toHaveBeenCalled();
  });

  it("stale db + TMDB ok: atualiza Redis e devolve ficha do TMDB", async () => {
    const staleDetails = MovieCatalogDetailsResolverFixtures.details({
      title: "Interestelar (local velho)",
    });
    const tmdbDetails = MovieCatalogDetailsResolverFixtures.details({
      title: "Interstellar",
    });
    const updatedAt = MovieCatalogDetailsResolverFixtures.staleUpdatedAt(now);
    const localRecord = MovieCatalogDetailsResolverFixtures.storedRecord(
      staleDetails,
      updatedAt,
    );

    vi.mocked(cache.get).mockResolvedValue(null);
    vi.mocked(repository.findByTmdbId).mockResolvedValue(localRecord);
    vi.mocked(catalog.getMovieDetails).mockResolvedValue(tmdbDetails);

    const result = await resolver.resolveByTmdbId(tmdbId);

    expect(result).toBe(tmdbDetails);
    expect(catalog.getMovieDetails).toHaveBeenCalledWith(tmdbId, lang);
    expect(cache.set).toHaveBeenCalledWith(tmdbId, tmdbDetails, lang);
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it("stale db + TMDB fail: loga e devolve ficha local velha", async () => {
    const staleDetails = MovieCatalogDetailsResolverFixtures.details({
      title: "Interestelar (local velho)",
    });
    const updatedAt = MovieCatalogDetailsResolverFixtures.staleUpdatedAt(now);
    const localRecord = MovieCatalogDetailsResolverFixtures.storedRecord(
      staleDetails,
      updatedAt,
    );
    const tmdbError = new Error("TMDB unavailable");

    vi.mocked(cache.get).mockResolvedValue(null);
    vi.mocked(repository.findByTmdbId).mockResolvedValue(localRecord);
    vi.mocked(catalog.getMovieDetails).mockRejectedValue(tmdbError);

    const result = await resolver.resolveByTmdbId(tmdbId);

    expect(result).toBe(staleDetails);
    expect(Logger.warn).toHaveBeenCalledWith(
      "Movie catalog details TMDB refresh failed, returning stale local record",
      expect.objectContaining({ tmdbId }),
    );
    expect(cache.set).not.toHaveBeenCalled();
  });

  it("prisma throw: loga, pula banco e busca no TMDB", async () => {
    const tmdbDetails = MovieCatalogDetailsResolverFixtures.details();
    const repoError = new Error("Postgres down");

    vi.mocked(cache.get).mockResolvedValue(null);
    vi.mocked(repository.findByTmdbId).mockRejectedValue(repoError);
    vi.mocked(catalog.getMovieDetails).mockResolvedValue(tmdbDetails);

    const result = await resolver.resolveByTmdbId(tmdbId);

    expect(result).toBe(tmdbDetails);
    expect(Logger.warn).toHaveBeenCalledWith(
      "Movie catalog findByTmdbId failed, skipping to TMDB",
      expect.objectContaining({ tmdbId }),
    );
    expect(catalog.getMovieDetails).toHaveBeenCalledWith(tmdbId, lang);
    expect(cache.set).toHaveBeenCalledWith(tmdbId, tmdbDetails, lang);
  });

  it("sem registro local + TMDB ok: grava Redis e devolve ficha", async () => {
    const tmdbDetails = MovieCatalogDetailsResolverFixtures.details();

    vi.mocked(cache.get).mockResolvedValue(null);
    vi.mocked(repository.findByTmdbId).mockResolvedValue(null);
    vi.mocked(catalog.getMovieDetails).mockResolvedValue(tmdbDetails);

    const result = await resolver.resolveByTmdbId(tmdbId);

    expect(result).toBe(tmdbDetails);
    expect(catalog.getMovieDetails).toHaveBeenCalledWith(tmdbId, lang);
    expect(cache.set).toHaveBeenCalledWith(tmdbId, tmdbDetails, lang);
  });

  it("sem registro local + TMDB fail: relança o erro", async () => {
    const tmdbError = new Error("TMDB unavailable");

    vi.mocked(cache.get).mockResolvedValue(null);
    vi.mocked(repository.findByTmdbId).mockResolvedValue(null);
    vi.mocked(catalog.getMovieDetails).mockRejectedValue(tmdbError);

    await expect(resolver.resolveByTmdbId(tmdbId)).rejects.toThrow(tmdbError);
    expect(cache.set).not.toHaveBeenCalled();
  });
});
