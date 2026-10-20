import { describe, it, expect } from "vitest";
import { UserMovieEntryCatalogSummaryUtils } from "../movie-summary-catalog.utils";

class CatalogSummaryFixtures {
  static row(overrides: Record<string, unknown> = {}) {
    return {
      tmdbId: 1368337,
      language: "en-US",
      title: "The Odyssey",
      year: 2026,
      posterPath: "/odyssey.jpg",
      tmdbVoteAverage: 8.2,
      ...overrides,
    };
  }
}

describe("UserMovieEntryCatalogSummaryUtils", () => {
  describe("buildPreferredByTmdbId", () => {
    it("mapeia o summary a partir da linha de catálogo", () => {
      const rows = [CatalogSummaryFixtures.row()];

      const summaries = UserMovieEntryCatalogSummaryUtils.buildPreferredByTmdbId(
        rows,
      );

      expect(summaries.get(1368337)).toEqual({
        title: "The Odyssey",
        year: 2026,
        posterPath: "/odyssey.jpg",
        voteAverage: 8.2,
      });
    });

    it("prefere pt-BR quando o mesmo tmdbId existe em vários idiomas", () => {
      const rows = [
        CatalogSummaryFixtures.row({ language: "en-US" }),
        CatalogSummaryFixtures.row({
          language: "pt-BR",
          title: "A Odisseia",
        }),
      ];

      const summaries = UserMovieEntryCatalogSummaryUtils.buildPreferredByTmdbId(
        rows,
      );

      expect(summaries.get(1368337)?.title).toBe("A Odisseia");
    });

    it("usa a primeira linha de fallback quando não existe pt-BR", () => {
      const rows = [
        CatalogSummaryFixtures.row({ language: "en-US" }),
        CatalogSummaryFixtures.row({
          language: "es-ES",
          title: "La Odisea",
        }),
      ];

      const summaries = UserMovieEntryCatalogSummaryUtils.buildPreferredByTmdbId(
        rows,
      );

      expect(summaries.get(1368337)?.title).toBe("The Odyssey");
    });

    it("mantém o pt-BR mesmo quando ele aparece depois do fallback", () => {
      const rows = [
        CatalogSummaryFixtures.row({ language: "es-ES", title: "La Odisea" }),
        CatalogSummaryFixtures.row({ language: "pt-BR", title: "A Odisseia" }),
        CatalogSummaryFixtures.row({ language: "en-US", title: "The Odyssey" }),
      ];

      const summaries = UserMovieEntryCatalogSummaryUtils.buildPreferredByTmdbId(
        rows,
      );

      expect(summaries.get(1368337)?.title).toBe("A Odisseia");
    });

    it("retorna mapa vazio sem linhas", () => {
      const summaries =
        UserMovieEntryCatalogSummaryUtils.buildPreferredByTmdbId([]);

      expect(summaries.size).toBe(0);
    });
  });

  describe("listLanguages", () => {
    it("lista idiomas distintos na ordem de aparição", () => {
      const rows = [
        CatalogSummaryFixtures.row({ language: "en-US" }),
        CatalogSummaryFixtures.row({ language: "pt-BR" }),
        CatalogSummaryFixtures.row({ language: "en-US" }),
      ];

      const languages = UserMovieEntryCatalogSummaryUtils.listLanguages(rows);

      expect(languages).toEqual(["en-US", "pt-BR"]);
    });
  });
});
