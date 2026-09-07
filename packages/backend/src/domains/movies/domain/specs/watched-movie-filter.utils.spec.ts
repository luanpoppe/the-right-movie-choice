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
  it("REQ-6: substitui hits assistidos por miss e mantém ordem/comprimento do array", () => {
    const watchedHit = WatchedMovieFilterUtilsFixtures.hit(100, "Assistido");
    const unwatchedHit = WatchedMovieFilterUtilsFixtures.hit(200, "Não assistido");
    const miss = WatchedMovieFilterUtilsFixtures.miss("Não encontrado");
    const results = [watchedHit, unwatchedHit, miss];
    const watchedTmdbIds = new Set([100]);

    const filtered = WatchedMovieFilterUtils.filterLookupResults(
      results,
      watchedTmdbIds,
    );

    expect(filtered).toHaveLength(3);
    expect(filtered[0]).toEqual({
      found: false,
      message: "Filme já assistido pelo usuário.",
    });
    expect(filtered[1]).toEqual(unwatchedHit);
    expect(filtered[2]).toEqual(miss);
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

  it("todos os hits assistidos retorna misses na mesma posição", () => {
    const hitA = WatchedMovieFilterUtilsFixtures.hit(100, "A");
    const hitB = WatchedMovieFilterUtilsFixtures.hit(200, "B");
    const results = [hitA, hitB];
    const watchedTmdbIds = new Set([100, 200]);

    const filtered = WatchedMovieFilterUtils.filterLookupResults(
      results,
      watchedTmdbIds,
    );

    expect(filtered).toHaveLength(2);
    expect(filtered[0]?.found).toBe(false);
    expect(filtered[1]?.found).toBe(false);
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

  it("preserva a ordem e comprimento substituindo assistidos por miss", () => {
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

    expect(filtered).toHaveLength(4);
    expect(filtered[0]?.found).toBe(false);
    expect(filtered[1]).toEqual(miss);
    expect(filtered[2]).toEqual(hitB);
    expect(filtered[3]?.found).toBe(false);
  });
});
