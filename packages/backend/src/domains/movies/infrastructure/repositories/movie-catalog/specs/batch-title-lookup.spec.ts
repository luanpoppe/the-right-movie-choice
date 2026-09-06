import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "@/lib/logger/logger";
import { MovieWatchProviderKind } from "../../../../../../../generated/prisma/client.js";
import { MovieCatalogBatchTitleLookup } from "../batch-title-lookup";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class BatchTitleLookupFixtures {
  static prismaRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 42,
      tmdbId: 157336,
      language: "pt-BR",
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Sinopse",
      runtimeMinutes: 169,
      tmdbVoteAverage: 8.4,
      imdbId: "tt0816692",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      genres: [{ id: 1, name: "Ficção científica", movieId: 42 }],
      directors: [{ id: 1, name: "Christopher Nolan", movieId: 42 }],
      cast: [{ id: 1, name: "Matthew McConaughey", sortOrder: 0, movieId: 42 }],
      originCountries: [{ id: 1, code: "US", movieId: 42 }],
      watchProviders: [
        {
          id: 1,
          kind: MovieWatchProviderKind.flatrate,
          providerName: "Netflix",
          logoPath: "/netflix.png",
          movieId: 42,
        },
      ],
      ...overrides,
    };
  }
}

describe("MovieCatalogBatchTitleLookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildSearchableItems", () => {
    it("ignora título vazio e preserva índice dos demais", () => {
      const items = MovieCatalogBatchTitleLookup.buildSearchableItems([
        { title: "Interestelar", year: 2014 },
        { title: "" },
        { title: "Duna", year: 2021, language: "en-US" },
      ]);

      expect(items).toHaveLength(2);
      expect(items[0]?.index).toBe(0);
      expect(items[0]?.catalogLanguage).toBe("pt-BR");
      expect(items[0]?.year).toBe(2014);
      expect(items[1]?.index).toBe(2);
      expect(items[1]?.catalogLanguage).toBe("en-US");
    });
  });

  describe("collectUniqueMovieIds", () => {
    it("deduplica ids mantendo ordem de primeira aparição", () => {
      const uniqueIds = MovieCatalogBatchTitleLookup.collectUniqueMovieIds([
        { id: 42 },
        { id: 43 },
        { id: 42 },
        { id: 44 },
      ]);

      expect(uniqueIds).toEqual([42, 43, 44]);
    });
  });

  describe("createEmptyResults", () => {
    it("cria array de nulls com tamanho da entrada", () => {
      const results = MovieCatalogBatchTitleLookup.createEmptyResults(3);

      expect(results).toEqual([null, null, null]);
    });
  });

  describe("applyIdRowsToResults", () => {
    it("mapeia hit por idx e deixa índice sem match como null", () => {
      const row0 = BatchTitleLookupFixtures.prismaRow({
        id: 42,
        title: "Interestelar",
      });
      const row1 = BatchTitleLookupFixtures.prismaRow({
        id: 43,
        title: "Duna",
        tmdbId: 438631,
      });
      const rowById = new Map([
        [42, row0],
        [43, row1],
      ]);
      const inputs = [
        { title: "Interestelar", year: 2014 },
        { title: "Inexistente", year: 1999 },
        { title: "Duna", year: 2021 },
      ];
      const results = MovieCatalogBatchTitleLookup.createEmptyResults(3);

      const matchedIndices = MovieCatalogBatchTitleLookup.applyIdRowsToResults(
        inputs,
        [{ idx: 0, id: 42 }, { idx: 2, id: 43 }],
        rowById,
        results,
      );

      expect(results[0]?.details.title).toBe("Interestelar");
      expect(results[1]).toBeNull();
      expect(results[2]?.details.title).toBe("Duna");
      expect(matchedIndices).toEqual(new Set([0, 2]));
      expect(Logger.debug).toHaveBeenCalledWith(
        "Movie catalog find by titles and years hit",
        expect.objectContaining({ tmdbId: 157336 }),
      );
    });

    it("loga miss quando idRow aponta para row ausente no findMany", () => {
      const inputs = [{ title: "Interestelar", year: 2014 }];
      const results = MovieCatalogBatchTitleLookup.createEmptyResults(1);
      const rowById = new Map<number, ReturnType<typeof BatchTitleLookupFixtures.prismaRow>>();

      MovieCatalogBatchTitleLookup.applyIdRowsToResults(
        inputs,
        [{ idx: 0, id: 99 }],
        rowById,
        results,
      );

      expect(results[0]).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith(
        "Movie catalog find by titles and years miss",
        expect.objectContaining({ title: "Interestelar" }),
      );
    });
  });
});
