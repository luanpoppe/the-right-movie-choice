import { describe, expect, it } from "vitest";
import type { MovieRecommendationEntity } from "../../../domain/entities/movie-recommendation.entity";
import {
  ExcludeWatchedRecommendationSanitizer,
  type ExcludeWatchedContextEntry,
} from "../exclude-watched-recommendation.sanitizer";

class ExcludeWatchedRecommendationSanitizerFixtures {
  static movie(
    overrides: Partial<MovieRecommendationEntity["movies"][number]> = {},
  ): MovieRecommendationEntity["movies"][number] {
    return {
      title: "Inception",
      director: "Christopher Nolan",
      actors: ["Leonardo DiCaprio"],
      releaseYear: 2010,
      streamingPlatform: "Netflix",
      imdbRating: 8.8,
      synopsis: "Sinopse",
      whySuggestion: "Motivo",
      durationInMinutes: 148,
      ...overrides,
    };
  }

  static recommendation(
    movies: MovieRecommendationEntity["movies"],
    response = "sugestão",
  ): MovieRecommendationEntity {
    return { movies, response };
  }
}

describe("ExcludeWatchedRecommendationSanitizer", () => {
  describe("sanitize", () => {
    it("remove filmes cujo tmdbId está no conjunto de assistidos", () => {
      const watchedMovie = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Assistido",
        tmdbId: 100,
      });
      const unwatchedMovie = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Não assistido",
        tmdbId: 200,
      });
      const withoutTmdbId = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Sem tmdbId",
      });
      const recommendation =
        ExcludeWatchedRecommendationSanitizerFixtures.recommendation([
          watchedMovie,
          unwatchedMovie,
          withoutTmdbId,
        ]);
      const watchedTmdbIds = new Set([100]);

      const sanitized = ExcludeWatchedRecommendationSanitizer.sanitize(
        recommendation,
        watchedTmdbIds,
      );

      expect(sanitized.movies).toEqual([unwatchedMovie, withoutTmdbId]);
      expect(sanitized.response).toBe(recommendation.response);
    });

    it("retorna a mesma entidade quando o conjunto de assistidos está vazio", () => {
      const recommendation =
        ExcludeWatchedRecommendationSanitizerFixtures.recommendation([
          ExcludeWatchedRecommendationSanitizerFixtures.movie({ tmdbId: 100 }),
        ]);

      const sanitized = ExcludeWatchedRecommendationSanitizer.sanitize(
        recommendation,
        new Set(),
      );

      expect(sanitized).toBe(recommendation);
    });
  });

  describe("countVerifiedUnwatched", () => {
    it("conta apenas filmes com tmdbId positivo definido", () => {
      const recommendation =
        ExcludeWatchedRecommendationSanitizerFixtures.recommendation([
          ExcludeWatchedRecommendationSanitizerFixtures.movie({ tmdbId: 100 }),
          ExcludeWatchedRecommendationSanitizerFixtures.movie({ tmdbId: 200 }),
          ExcludeWatchedRecommendationSanitizerFixtures.movie({
            title: "Sem id",
          }),
        ]);

      const count =
        ExcludeWatchedRecommendationSanitizer.countVerifiedUnwatched(
          recommendation,
        );

      expect(count).toBe(2);
    });

    it("retorna zero quando nenhum filme tem tmdbId", () => {
      const recommendation =
        ExcludeWatchedRecommendationSanitizerFixtures.recommendation([
          ExcludeWatchedRecommendationSanitizerFixtures.movie(),
        ]);

      const count =
        ExcludeWatchedRecommendationSanitizer.countVerifiedUnwatched(
          recommendation,
        );

      expect(count).toBe(0);
    });
  });

  describe("buildFinalRoundInstructionMessage", () => {
    it("pede aviso de esgotamento no idioma do usuário na última rodada", () => {
      const minVerifiedUnwatched = 2;

      const message =
        ExcludeWatchedRecommendationSanitizer.buildFinalRoundInstructionMessage(
          minVerifiedUnwatched,
        );

      expect(message).toContain("última rodada");
      expect(message).toContain("menos de 2 filmes");
      expect(message).toContain("mesmo idioma da última mensagem do usuário");
    });
  });

  describe("ensureExhaustionNotice", () => {
    it("anexa aviso fallback quando response não sinaliza esgotamento", () => {
      const response = "Here are a couple of picks for you.";

      const ensured =
        ExcludeWatchedRecommendationSanitizer.ensureExhaustionNotice(response);

      expect(ensured).toContain(response);
      expect(ensured).toContain("couldn't find many unwatched matches");
    });

    it("preserva response que já menciona histórico esgotado", () => {
      const response =
        "You've already watched almost everything I could suggest here.";

      const ensured =
        ExcludeWatchedRecommendationSanitizer.ensureExhaustionNotice(response);

      expect(ensured).toBe(response);
    });
  });

  describe("buildExclusionContextMessage", () => {
    it("lista títulos e tmdbIds já sugeridos ou assistidos", () => {
      const entries: ExcludeWatchedContextEntry[] = [
        { title: "Matrix", tmdbId: 603, watched: true },
        { title: "Blade Runner", tmdbId: 78, watched: false },
      ];

      const message =
        ExcludeWatchedRecommendationSanitizer.buildExclusionContextMessage(
          entries,
        );

      expect(message).toContain("Matrix");
      expect(message).toContain("tmdbId: 603");
      expect(message).toContain("já assistido");
      expect(message).toContain("Blade Runner");
      expect(message).toContain("já sugerido");
    });

    it("retorna string vazia quando não há entradas de exclusão", () => {
      const message =
        ExcludeWatchedRecommendationSanitizer.buildExclusionContextMessage([]);

      expect(message).toBe("");
    });
  });

  describe("processRoundResult", () => {
    it("sanitiza, conta verificados e acumula exclusões em uma única passagem", () => {
      const watchedMovie = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Assistido",
        tmdbId: 100,
      });
      const unwatchedMovie = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Livre",
        tmdbId: 200,
      });
      const recommendation =
        ExcludeWatchedRecommendationSanitizerFixtures.recommendation([
          watchedMovie,
          unwatchedMovie,
        ]);
      const existing: ExcludeWatchedContextEntry[] = [
        { title: "Antigo", tmdbId: 50, watched: false },
      ];

      const result = ExcludeWatchedRecommendationSanitizer.processRoundResult(
        recommendation,
        new Set([100]),
        existing,
      );

      expect(result.sanitized.movies).toEqual([unwatchedMovie]);
      expect(result.verifiedUnwatchedCount).toBe(1);
      expect(result.exclusionEntries).toHaveLength(3);
      expect(
        result.exclusionEntries.find((entry) => entry.tmdbId === 100)?.watched,
      ).toBe(true);
    });

    it("REQ-8: verifiedUnwatchedCount zero quando todos os filmes verificados são assistidos", () => {
      const watchedA = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Assistido A",
        tmdbId: 100,
      });
      const watchedB = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Assistido B",
        tmdbId: 101,
      });
      const recommendation =
        ExcludeWatchedRecommendationSanitizerFixtures.recommendation([
          watchedA,
          watchedB,
        ]);

      const result = ExcludeWatchedRecommendationSanitizer.processRoundResult(
        recommendation,
        new Set([100, 101]),
        [],
      );

      expect(result.sanitized.movies).toEqual([]);
      expect(result.verifiedUnwatchedCount).toBe(0);
      expect(result.exclusionEntries).toHaveLength(2);
      expect(result.exclusionEntries.every((entry) => entry.watched)).toBe(true);
    });

    it("mantém filmes sem tmdbId e não os conta como verificados", () => {
      const withoutTmdbId = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Sem catálogo",
      });
      const verified = ExcludeWatchedRecommendationSanitizerFixtures.movie({
        title: "Verificado",
        tmdbId: 200,
      });
      const recommendation =
        ExcludeWatchedRecommendationSanitizerFixtures.recommendation([
          withoutTmdbId,
          verified,
        ]);

      const result = ExcludeWatchedRecommendationSanitizer.processRoundResult(
        recommendation,
        new Set<number>(),
        [],
      );

      expect(result.sanitized.movies).toEqual([withoutTmdbId, verified]);
      expect(result.verifiedUnwatchedCount).toBe(1);
    });
  });

  describe("extractTmdbIds", () => {
    it("retorna apenas tmdbIds positivos definidos", () => {
      const movies = [
        ExcludeWatchedRecommendationSanitizerFixtures.movie({ tmdbId: 100 }),
        ExcludeWatchedRecommendationSanitizerFixtures.movie({
          title: "Sem id",
        }),
        ExcludeWatchedRecommendationSanitizerFixtures.movie({ tmdbId: 0 }),
        ExcludeWatchedRecommendationSanitizerFixtures.movie({ tmdbId: 200 }),
      ];

      const tmdbIds = ExcludeWatchedRecommendationSanitizer.extractTmdbIds(movies);

      expect(tmdbIds).toEqual([100, 200]);
    });
  });

  describe("mergeExclusionEntries", () => {
    it("acumula entradas sem duplicar pelo tmdbId", () => {
      const existing: ExcludeWatchedContextEntry[] = [
        { title: "Matrix", tmdbId: 603, watched: false },
      ];
      const movies = [
        ExcludeWatchedRecommendationSanitizerFixtures.movie({
          title: "Matrix Reloaded",
          tmdbId: 603,
        }),
      ];

      const merged = ExcludeWatchedRecommendationSanitizer.mergeExclusionEntries(
        movies,
        new Set([603]),
        existing,
      );

      expect(merged).toHaveLength(1);
      expect(merged[0]?.watched).toBe(true);
    });
  });
});
