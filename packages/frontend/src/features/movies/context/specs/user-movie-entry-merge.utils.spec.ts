import { UserMovieEntryEntity } from "../../entities/user-movie-entry.entity";
import {
  DEFAULT_USER_MOVIE_ENTRY_FLAGS,
  UserMovieEntryMergeUtils,
} from "../user-movie-entry-merge.utils";

class UserMovieEntryMergeFixtures {
  static entry(
    overrides: Partial<UserMovieEntryEntity> = {},
  ): UserMovieEntryEntity {
    return {
      tmdbId: 27205,
      movieId: 1,
      watched: false,
      favorite: true,
      inWatchlist: false,
      rating: null,
      watchedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...overrides,
    };
  }
}

describe("UserMovieEntryMergeUtils", () => {
  describe("applyOptimisticPatch", () => {
    it("cria entrada nova com defaults quando não existe entrada prévia", () => {
      const patch = { favorite: true };
      const result = UserMovieEntryMergeUtils.applyOptimisticPatch(
        undefined,
        27205,
        patch,
      );

      expect(result.tmdbId).toBe(27205);
      expect(result.favorite).toBe(true);
      expect(result.watched).toBe(false);
      expect(result.inWatchlist).toBe(false);
      expect(result.rating).toBeNull();
      expect(result.watchedAt).toBeNull();
      expect(result.movieId).toBeNull();
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
    });

    it("mescla patch parcial em entrada existente", () => {
      const existing = UserMovieEntryMergeFixtures.entry({
        favorite: false,
        inWatchlist: false,
      });

      const result = UserMovieEntryMergeUtils.applyOptimisticPatch(
        existing,
        27205,
        { inWatchlist: true },
      );

      expect(result.favorite).toBe(false);
      expect(result.inWatchlist).toBe(true);
      expect(result.createdAt).toBe(existing.createdAt);
      expect(result.updatedAt).not.toBe(existing.updatedAt);
    });

    it("aplica watched, rating e watchedAt no patch de assistido", () => {
      const existing = UserMovieEntryMergeFixtures.entry();

      const result = UserMovieEntryMergeUtils.applyOptimisticPatch(
        existing,
        157336,
        {
          watched: true,
          rating: 8,
          watchedAt: "2026-03-15T00:00:00.000Z",
        },
      );

      expect(result.watched).toBe(true);
      expect(result.rating).toBe(8);
      expect(result.watchedAt).toBe("2026-03-15T00:00:00.000Z");
    });

    it("desmarca assistido mantendo outros flags", () => {
      const existing = UserMovieEntryMergeFixtures.entry({
        watched: true,
        favorite: true,
        rating: 9,
        watchedAt: "2026-03-15T00:00:00.000Z",
      });

      const result = UserMovieEntryMergeUtils.applyOptimisticPatch(
        existing,
        157336,
        { watched: false },
      );

      expect(result.watched).toBe(false);
      expect(result.favorite).toBe(true);
      expect(result.rating).toBe(9);
      expect(result.watchedAt).toBe("2026-03-15T00:00:00.000Z");
    });
  });

  describe("toFlags", () => {
    it("converte entidade em flags para o card", () => {
      const entry = UserMovieEntryMergeFixtures.entry({
        watched: true,
        favorite: true,
        inWatchlist: true,
        rating: 7,
        watchedAt: "2026-03-15T00:00:00.000Z",
      });

      expect(UserMovieEntryMergeUtils.toFlags(entry)).toEqual({
        watched: true,
        favorite: true,
        inWatchlist: true,
        rating: 7,
        watchedAt: "2026-03-15T00:00:00.000Z",
      });
    });
  });

  describe("DEFAULT_USER_MOVIE_ENTRY_FLAGS", () => {
    it("representa toggles inativos para card sem entrada", () => {
      expect(DEFAULT_USER_MOVIE_ENTRY_FLAGS).toEqual({
        watched: false,
        favorite: false,
        inWatchlist: false,
        rating: null,
        watchedAt: null,
      });
    });
  });
});
