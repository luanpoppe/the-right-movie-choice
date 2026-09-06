import { describe, it, expect } from "vitest";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieCatalogLookupResult } from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import { MovieCatalogFreshnessUtils } from "@/domains/movies/domain/movie-catalog-freshness.utils";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  MovieCatalogStoredRecord,
} from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { MovieCatalogBatchLookup } from "../batch-catalog-lookup";

class BatchCatalogLookupFixtures {
  static details(tmdbId: number, title: string): MovieCatalogDetails {
    return {
      tmdbId,
      title,
      year: 2010,
      posterPath: "/poster.jpg",
      overview: "Sinopse",
      runtimeMinutes: 120,
      genres: ["Drama"],
      tmdbVoteAverage: 8,
      originCountries: ["US"],
      directors: ["Director"],
      cast: ["Actor"],
      watchProviders: { flatrate: [], rent: [], buy: [] },
      imdbId: `tt${String(tmdbId).padStart(7, "0")}`,
    };
  }

  static storedRecord(
    details: MovieCatalogDetails,
    updatedAt: Date,
  ): MovieCatalogStoredRecord {
    return { details, updatedAt };
  }

  static freshUpdatedAt(now: Date): Date {
    const freshForMs = MovieCatalogFreshnessUtils.FRESH_FOR_MS;
    return new Date(now.getTime() - freshForMs + 1);
  }

  static staleUpdatedAt(now: Date): Date {
    const freshForMs = MovieCatalogFreshnessUtils.FRESH_FOR_MS;
    return new Date(now.getTime() - freshForMs);
  }
}

describe("MovieCatalogBatchLookup", () => {
  const now = new Date("2026-09-05T12:00:00.000Z");

  describe("prepareBatchLookup", () => {
    it("marca query vazia como miss e exclui do batchInputs", () => {
      const prepared = MovieCatalogBatchLookup.prepareBatchLookup([
        { query: "" },
        { query: "Interestelar", year: 2014 },
      ]);

      expect(prepared.results[0]).toEqual({
        found: false,
        message: MovieCatalogBatchLookup.EMPTY_QUERY_MESSAGE,
      });
      expect(prepared.results[1]).toBeNull();
      expect(prepared.indicesPendingLocalLookup).toEqual([1]);
      expect(prepared.batchInputs).toEqual([
        {
          title: "Interestelar",
          year: 2014,
          language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
        },
      ]);
    });

    it("edge idioma por item: repassa language distinto no batchInputs", () => {
      const prepared = MovieCatalogBatchLookup.prepareBatchLookup([
        { query: "Interestelar", language: "pt-BR" },
        { query: "Interstellar", language: "en-US" },
      ]);

      expect(prepared.batchInputs).toEqual([
        { title: "Interestelar", language: "pt-BR" },
        { title: "Interstellar", language: "en-US" },
      ]);
    });

    it("usa pt-BR quando language omitido ou vazio", () => {
      const prepared = MovieCatalogBatchLookup.prepareBatchLookup([
        { query: "Interestelar" },
        { query: "Duna", language: "" },
      ]);

      expect(prepared.batchInputs).toEqual([
        { title: "Interestelar", language: DEFAULT_MOVIE_CATALOG_LANGUAGE },
        { title: "Duna", language: DEFAULT_MOVIE_CATALOG_LANGUAGE },
      ]);
    });
  });

  describe("applyLocalFreshHits", () => {
    it("hit fresco preenche resultado e gera cacheWarmItem", () => {
      const details = BatchCatalogLookupFixtures.details(157336, "Interestelar");
      const freshUpdatedAt = BatchCatalogLookupFixtures.freshUpdatedAt(now);
      const inputs = [{ query: "Interestelar" }];
      const results: Array<MovieCatalogLookupResult | null> = [null];

      const outcome = MovieCatalogBatchLookup.applyLocalFreshHits(
        inputs,
        [0],
        [BatchCatalogLookupFixtures.storedRecord(details, freshUpdatedAt)],
        results,
        now,
      );

      expect(results[0]).toEqual({ found: true, details });
      expect(outcome.cacheWarmItems).toEqual([
        { movieId: 157336, details, lang: DEFAULT_MOVIE_CATALOG_LANGUAGE },
      ]);
      expect(outcome.indicesNeedingTmdbLookup).toEqual([]);
    });

    it("registro stale (>30d) vai para fase 2 sem cacheWarm", () => {
      const details = BatchCatalogLookupFixtures.details(157336, "Interestelar");
      const staleUpdatedAt = BatchCatalogLookupFixtures.staleUpdatedAt(now);
      const inputs = [{ query: "Interestelar" }];
      const results: Array<MovieCatalogLookupResult | null> = [null];

      const outcome = MovieCatalogBatchLookup.applyLocalFreshHits(
        inputs,
        [0],
        [BatchCatalogLookupFixtures.storedRecord(details, staleUpdatedAt)],
        results,
        now,
      );

      expect(results[0]).toBeNull();
      expect(outcome.cacheWarmItems).toEqual([]);
      expect(outcome.indicesNeedingTmdbLookup).toEqual([0]);
    });

    it("null no mapa local conta como miss da fase 1", () => {
      const inputs = [{ query: "Inexistente" }];
      const results: Array<MovieCatalogLookupResult | null> = [null];

      const outcome = MovieCatalogBatchLookup.applyLocalFreshHits(
        inputs,
        [0],
        [null],
        results,
        now,
      );

      expect(results[0]).toBeNull();
      expect(outcome.indicesNeedingTmdbLookup).toEqual([0]);
    });
  });
});
