import { describe, expect, it } from "vitest";
import type { MovieCatalogLookupResult } from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import { WatchedMovieFilterUtils } from "../watched-movie-filter.utils";

class WatchedMovieFilterUtilsFixtures {
  static hit(tmdbId: number, title: string): MovieCatalogLookupResult {
    return {
      found: true,
      details: {
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
        imdbId: "tt0000001",
      },
    };
  }

  static miss(message: string): MovieCatalogLookupResult {
    return { found: false, message };
  }
}

describe("WatchedMovieFilterUtils", () => {
  it("REQ-6: remove hits assistidos e mantém hits não assistidos e misses", () => {
    const watchedHit = WatchedMovieFilterUtilsFixtures.hit(100, "Assistido");
    const unwatchedHit = WatchedMovieFilterUtilsFixtures.hit(200, "Não assistido");
    const miss = WatchedMovieFilterUtilsFixtures.miss("Não encontrado");
    const results = [watchedHit, unwatchedHit, miss];
    const watchedTmdbIds = new Set([100]);

    const filtered = WatchedMovieFilterUtils.filterLookupResults(
      results,
      watchedTmdbIds,
    );

    expect(filtered).toEqual([unwatchedHit, miss]);
  });

  it("conjunto de assistidos vazio retorna o mesmo array sem filtrar", () => {
    const hit = WatchedMovieFilterUtilsFixtures.hit(100, "Filme");
    const miss = WatchedMovieFilterUtilsFixtures.miss("Miss");
    const results = [hit, miss];
    const watchedTmdbIds = new Set<number>();

    const filtered = WatchedMovieFilterUtils.filterLookupResults(
      results,
      watchedTmdbIds,
    );

    expect(filtered).toBe(results);
  });

  it("todos os hits assistidos retorna array vazio quando só há hits", () => {
    const hitA = WatchedMovieFilterUtilsFixtures.hit(100, "A");
    const hitB = WatchedMovieFilterUtilsFixtures.hit(200, "B");
    const results = [hitA, hitB];
    const watchedTmdbIds = new Set([100, 200]);

    const filtered = WatchedMovieFilterUtils.filterLookupResults(
      results,
      watchedTmdbIds,
    );

    expect(filtered).toEqual([]);
  });

  it("misses são sempre preservados mesmo com conjunto de assistidos não vazio", () => {
    const missA = WatchedMovieFilterUtilsFixtures.miss("Primeiro miss");
    const missB = WatchedMovieFilterUtilsFixtures.miss("Segundo miss");
    const results = [missA, missB];
    const watchedTmdbIds = new Set([100, 200, 300]);

    const filtered = WatchedMovieFilterUtils.filterLookupResults(
      results,
      watchedTmdbIds,
    );

    expect(filtered).toEqual([missA, missB]);
  });

  it("preserva a ordem dos itens mantidos", () => {
    const hitA = WatchedMovieFilterUtilsFixtures.hit(100, "A");
    const miss = WatchedMovieFilterUtilsFixtures.miss("Miss");
    const hitB = WatchedMovieFilterUtilsFixtures.hit(200, "B");
    const hitC = WatchedMovieFilterUtilsFixtures.hit(300, "C");
    const results = [hitA, miss, hitB, hitC];
    const watchedTmdbIds = new Set([100, 300]);

    const filtered = WatchedMovieFilterUtils.filterLookupResults(
      results,
      watchedTmdbIds,
    );

    expect(filtered).toEqual([miss, hitB]);
  });
});
