import { describe, expect, it } from "vitest";
import type { UserMovieEntryEntity } from "../../../../domain/entities/user-movie-entry.entity";
import { UserMovieEntryMergeUtils } from "../user-movie-entry-merge.utils";

class UserMovieEntryMergeFixtures {
  static existing(overrides: Partial<UserMovieEntryEntity> = {}): UserMovieEntryEntity {
    return {
      userId: 42,
      tmdbId: 157336,
      movieId: null,
      watched: true,
      favorite: true,
      inWatchlist: false,
      rating: 8,
      watchedAt: new Date("2024-06-15T20:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }
}

describe("UserMovieEntryMergeUtils", () => {
  describe("merge", () => {
    it("REQ-2 preserva flags não enviados no patch", () => {
      const existing = UserMovieEntryMergeFixtures.existing();

      const merged = UserMovieEntryMergeUtils.merge(existing, { inWatchlist: true });

      expect(merged.watched).toBe(true);
      expect(merged.favorite).toBe(true);
      expect(merged.inWatchlist).toBe(true);
    });

    it("sem entrada existente aplica defaults false e null", () => {
      const merged = UserMovieEntryMergeUtils.merge(null, { watched: true });

      expect(merged).toEqual({
        watched: true,
        favorite: false,
        inWatchlist: false,
        rating: null,
        watchedAt: null,
        movieId: null,
      });
    });

    it("REQ-5 preserva rating e watchedAt quando chaves não foram enviadas", () => {
      const existing = UserMovieEntryMergeFixtures.existing();
      const watchedAt = existing.watchedAt;

      const merged = UserMovieEntryMergeUtils.merge(existing, { watched: false });

      expect(merged.rating).toBe(8);
      expect(merged.watchedAt).toBe(watchedAt);
      expect(merged.watched).toBe(false);
    });

    it("limpa rating quando patch envia rating: null explicitamente", () => {
      const existing = UserMovieEntryMergeFixtures.existing({ rating: 8 });

      const merged = UserMovieEntryMergeUtils.merge(existing, { rating: null });

      expect(merged.rating).toBeNull();
    });

    it("limpa watchedAt quando patch envia watchedAt: null explicitamente", () => {
      const existing = UserMovieEntryMergeFixtures.existing();

      const merged = UserMovieEntryMergeUtils.merge(existing, { watchedAt: null });

      expect(merged.watchedAt).toBeNull();
    });

    it("REQ-7 atualiza movieId quando informado no patch", () => {
      const existing = UserMovieEntryMergeFixtures.existing({ movieId: null });

      const merged = UserMovieEntryMergeUtils.merge(existing, { movieId: 17 });

      expect(merged.movieId).toBe(17);
    });

    it("REQ-7 limpa movieId quando patch envia movieId: null explicitamente", () => {
      const existing = UserMovieEntryMergeFixtures.existing({ movieId: 17 });

      const merged = UserMovieEntryMergeUtils.merge(existing, { movieId: null });

      expect(merged.movieId).toBeNull();
    });

    it("REQ-4 detecta estado sem flags ativos após merge", () => {
      const existing = UserMovieEntryMergeFixtures.existing({
        watched: true,
        favorite: false,
        inWatchlist: false,
      });

      const merged = UserMovieEntryMergeUtils.merge(existing, { watched: false });

      expect(merged.watched).toBe(false);
      expect(merged.favorite).toBe(false);
      expect(merged.inWatchlist).toBe(false);
    });

    it.each([
      { flag: "watched" as const, value: false },
      { flag: "favorite" as const, value: true },
      { flag: "inWatchlist" as const, value: true },
    ])("aplica patch explícito de $flag", ({ flag, value }) => {
      const existing = UserMovieEntryMergeFixtures.existing({
        watched: false,
        favorite: false,
        inWatchlist: false,
      });

      const merged = UserMovieEntryMergeUtils.merge(existing, { [flag]: value });

      expect(merged[flag]).toBe(value);
    });
  });
});
