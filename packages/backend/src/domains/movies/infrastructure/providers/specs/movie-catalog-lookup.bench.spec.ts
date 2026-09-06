import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieCatalogLookupInput } from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import { DEFAULT_MOVIE_CATALOG_LANGUAGE } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { prisma } from "@/lib/prisma/prisma";
import { Redis } from "@/lib/redis/redis";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import { StringUtils } from "@/shared/utils/string.utils";
import { PrismaMovieCatalogRepository } from "../../repositories/movie-catalog/prisma-movie-catalog.repository";
import { MovieCatalogDetailsResolver } from "../movie-catalog-details.resolver";
import { MovieCatalogLookupService } from "../movie-catalog-lookup.service";

const BENCH_ITERATIONS = 25;
const BENCH_TMDB_ID_START = 9_900_001;

const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
const shouldSkipBench =
  StringUtils.isEmptyString(databaseUrl) ||
  StringUtils.isEmptyString(redisUrl);

type BenchMovieFixture = {
  input: MovieCatalogLookupInput;
  details: MovieCatalogDetails;
};

class CatalogLookupBenchFixtures {
  static readonly MOVIE_COUNT = 8;

  static movies(): BenchMovieFixture[] {
    const entries: Array<[string, number, number]> = [
      ["Bench Interestelar", 2014, BENCH_TMDB_ID_START],
      ["Bench Duna", 2021, BENCH_TMDB_ID_START + 1],
      ["Bench Matrix", 1999, BENCH_TMDB_ID_START + 2],
      ["Bench O Poderoso Chefão", 1972, BENCH_TMDB_ID_START + 3],
      ["Bench Pulp Fiction", 1994, BENCH_TMDB_ID_START + 4],
      ["Bench Senhor dos Anéis", 2001, BENCH_TMDB_ID_START + 5],
      ["Bench Clube da Luta", 1999, BENCH_TMDB_ID_START + 6],
      ["Bench Cidade de Deus", 2002, BENCH_TMDB_ID_START + 7],
    ];

    return entries.map(([title, year, tmdbId]) => {
      const details: MovieCatalogDetails = {
        tmdbId,
        title,
        year,
        posterPath: `/bench-poster-${tmdbId}.jpg`,
        overview: `Sinopse de ${title}`,
        runtimeMinutes: 120,
        genres: ["Drama"],
        tmdbVoteAverage: 8.0,
        originCountries: ["US"],
        directors: ["Diretor Bench"],
        cast: ["Ator Bench"],
        watchProviders: { flatrate: [], rent: [], buy: [] },
        imdbId: `tt${tmdbId}`,
      };

      const input: MovieCatalogLookupInput = { query: title, year };
      return { input, details };
    });
  }

  static inputs(): MovieCatalogLookupInput[] {
    const movies = CatalogLookupBenchFixtures.movies();
    return movies.map((movie) => movie.input);
  }

  static benchTmdbIds(): number[] {
    const movies = CatalogLookupBenchFixtures.movies();
    return movies.map((movie) => movie.details.tmdbId);
  }
}

class CatalogLookupBenchStats {
  static mean(samplesMs: number[]): number {
    const total = samplesMs.reduce((sum, value) => sum + value, 0);
    const count = samplesMs.length;
    if (count === 0) {
      return 0;
    }
    return total / count;
  }

  static median(samplesMs: number[]): number {
    const count = samplesMs.length;
    if (count === 0) {
      return 0;
    }

    const sorted = [...samplesMs].sort((a, b) => a - b);
    const middleIndex = Math.floor(count / 2);
    const isEvenCount = count % 2 === 0;

    if (isEvenCount) {
      const lower = sorted[middleIndex - 1] ?? 0;
      const upper = sorted[middleIndex] ?? 0;
      return (lower + upper) / 2;
    }

    return sorted[middleIndex] ?? 0;
  }

  static formatMs(valueMs: number): string {
    return valueMs.toFixed(2);
  }

  static printComparisonTable(
    unitaryMeanMs: number,
    unitaryMedianMs: number,
    batchMeanMs: number,
    batchMedianMs: number,
  ): void {
    const header = [
      "Caminho".padEnd(12),
      "Média (ms)".padStart(12),
      "Mediana (ms)".padStart(14),
    ].join(" | ");

    const unitaryRow = [
      "unitário".padEnd(12),
      CatalogLookupBenchStats.formatMs(unitaryMeanMs).padStart(12),
      CatalogLookupBenchStats.formatMs(unitaryMedianMs).padStart(14),
    ].join(" | ");

    const batchRow = [
      "batch".padEnd(12),
      CatalogLookupBenchStats.formatMs(batchMeanMs).padStart(12),
      CatalogLookupBenchStats.formatMs(batchMedianMs).padStart(14),
    ].join(" | ");

    const hasBatchTime = batchMeanMs > 0;
    const speedup = hasBatchTime
      ? (unitaryMeanMs / batchMeanMs).toFixed(2)
      : "n/a";
    const batchIsFaster = batchMeanMs < unitaryMeanMs;
    const speedupNote = batchIsFaster
      ? `Speedup médio (unitário/batch): ${speedup}x`
      : `Batch mais lento neste ambiente (${speedup}x)`;

    const unitaryMean = CatalogLookupBenchStats.formatMs(unitaryMeanMs);
    const unitaryMedian = CatalogLookupBenchStats.formatMs(unitaryMedianMs);
    const batchMean = CatalogLookupBenchStats.formatMs(batchMeanMs);
    const batchMedian = CatalogLookupBenchStats.formatMs(batchMedianMs);

    console.log("\n--- catalog-lookup benchmark (8 fresh local hits, integração) ---");
    console.log(header);
    console.log(unitaryRow);
    console.log(batchRow);
    console.log(
      `Iterações: ${BENCH_ITERATIONS} | Infra: Postgres + Redis reais | TMDB: não chamado`,
    );
    console.log(speedupNote);
    console.log("");
    console.log("Baseline desta execução (copie para o README):");
    console.log(
      `- unitário: média ${unitaryMean} ms | mediana ${unitaryMedian} ms`,
    );
    console.log(`- batch: média ${batchMean} ms | mediana ${batchMedian} ms`);
    console.log(`- speedup: ${speedup}x (unitário/batch)`);
    console.log("----------------------------------------------------------------\n");
  }
}

class CatalogLookupBenchHarness {
  static createService(): {
    catalog: IMovieCatalogProvider;
    service: MovieCatalogLookupService;
    cache: TmdbMovieDetailsCache;
    redis: Redis;
  } {
    const catalog: IMovieCatalogProvider = {
      searchMovies: vi.fn(() => {
        throw new Error("TMDB searchMovies não deve ser chamado no cenário de hit local");
      }),
      getMovieDetails: vi.fn(() => {
        throw new Error("TMDB getMovieDetails não deve ser chamado no cenário de hit local");
      }),
    };

    const redis = new Redis();
    const cache = new TmdbMovieDetailsCache(redis);
    const repository = new PrismaMovieCatalogRepository();
    const enqueuePersist = vi.fn().mockResolvedValue(undefined);
    const resolver = new MovieCatalogDetailsResolver(
      cache,
      repository,
      catalog,
      enqueuePersist,
    );
    const service = new MovieCatalogLookupService(
      catalog,
      repository,
      cache,
      resolver,
    );

    return { catalog, service, cache, redis };
  }

  static async clearCatalogCacheKeys(
    cache: TmdbMovieDetailsCache,
    redis: Redis,
    tmdbIds: number[],
  ): Promise<void> {
    for (const tmdbId of tmdbIds) {
      const key = cache.buildKey(tmdbId, DEFAULT_MOVIE_CATALOG_LANGUAGE);
      await redis.del(key);
    }
  }

  static async seedMovies(repository: PrismaMovieCatalogRepository): Promise<void> {
    const movies = CatalogLookupBenchFixtures.movies();
    const seedPromises = movies.map((movie) => {
      const details = movie.details;
      return repository.upsert(details, DEFAULT_MOVIE_CATALOG_LANGUAGE);
    });
    await Promise.all(seedPromises);
  }

  static async cleanupSeededMovies(): Promise<void> {
    const tmdbIds = CatalogLookupBenchFixtures.benchTmdbIds();
    await prisma.movie.deleteMany({
      where: {
        tmdbId: { in: tmdbIds },
        language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
      },
    });
  }
}

describe.skipIf(shouldSkipBench)("catalog-lookup benchmark (integração)", () => {
  const movies = CatalogLookupBenchFixtures.movies();
  const inputs = CatalogLookupBenchFixtures.inputs();
  const tmdbIds = CatalogLookupBenchFixtures.benchTmdbIds();

  let repository: PrismaMovieCatalogRepository;
  let harness: ReturnType<typeof CatalogLookupBenchHarness.createService>;

  beforeAll(async () => {
    repository = new PrismaMovieCatalogRepository();
    await CatalogLookupBenchHarness.cleanupSeededMovies();
    await CatalogLookupBenchHarness.seedMovies(repository);

    harness = CatalogLookupBenchHarness.createService();
    await CatalogLookupBenchHarness.clearCatalogCacheKeys(
      harness.cache,
      harness.redis,
      tmdbIds,
    );
  }, 60_000);

  afterAll(async () => {
    await CatalogLookupBenchHarness.cleanupSeededMovies();
    await harness.redis.client.quit();
  }, 30_000);

  it(
    "REQ-7: compara batch vs unitário com Postgres e Redis reais (8 fresh local hits)",
    async () => {
      const unitaryVerifyResults = await Promise.all(
        inputs.map((input) => harness.service.findDetailsByTitle(input)),
      );
      expect(unitaryVerifyResults.every((result) => result.found)).toBe(true);
      expect(harness.catalog.searchMovies).not.toHaveBeenCalled();
      expect(harness.catalog.getMovieDetails).not.toHaveBeenCalled();

      vi.mocked(harness.catalog.searchMovies).mockClear();
      vi.mocked(harness.catalog.getMovieDetails).mockClear();

      await CatalogLookupBenchHarness.clearCatalogCacheKeys(
        harness.cache,
        harness.redis,
        tmdbIds,
      );

      const batchVerifyResults =
        await harness.service.findDetailsByTitlesBatch(inputs);
      expect(batchVerifyResults.every((result) => result.found)).toBe(true);
      expect(harness.catalog.searchMovies).not.toHaveBeenCalled();
      expect(harness.catalog.getMovieDetails).not.toHaveBeenCalled();

      const unitarySamplesMs: number[] = [];
      const batchSamplesMs: number[] = [];

      for (let iteration = 0; iteration < BENCH_ITERATIONS; iteration++) {
        await CatalogLookupBenchHarness.clearCatalogCacheKeys(
          harness.cache,
          harness.redis,
          tmdbIds,
        );

        const unitaryStartedAt = performance.now();
        await Promise.all(
          inputs.map((input) => harness.service.findDetailsByTitle(input)),
        );
        const unitaryElapsedMs = performance.now() - unitaryStartedAt;
        unitarySamplesMs.push(unitaryElapsedMs);

        await CatalogLookupBenchHarness.clearCatalogCacheKeys(
          harness.cache,
          harness.redis,
          tmdbIds,
        );

        const batchStartedAt = performance.now();
        await harness.service.findDetailsByTitlesBatch(inputs);
        const batchElapsedMs = performance.now() - batchStartedAt;
        batchSamplesMs.push(batchElapsedMs);
      }

      const unitaryMeanMs = CatalogLookupBenchStats.mean(unitarySamplesMs);
      const unitaryMedianMs = CatalogLookupBenchStats.median(unitarySamplesMs);
      const batchMeanMs = CatalogLookupBenchStats.mean(batchSamplesMs);
      const batchMedianMs = CatalogLookupBenchStats.median(batchSamplesMs);

      expect(unitarySamplesMs).toHaveLength(BENCH_ITERATIONS);
      expect(batchSamplesMs).toHaveLength(BENCH_ITERATIONS);
      expect(unitaryMeanMs).toBeGreaterThan(0);
      expect(batchMeanMs).toBeGreaterThan(0);

      CatalogLookupBenchStats.printComparisonTable(
        unitaryMeanMs,
        unitaryMedianMs,
        batchMeanMs,
        batchMedianMs,
      );
    },
    120_000,
  );
});
