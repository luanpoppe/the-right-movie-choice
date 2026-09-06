import { describe, expect, it } from "vitest";
import type { UserMovieEntryPatch } from "../entities/user-movie-entry.entity";
import { UserMovieEntryValidationException } from "../exceptions/user-movie-entry-validation.exception";
import { UserMovieEntryValidationUtils } from "../user-movie-entry-validation.utils";

describe("UserMovieEntryValidationUtils", () => {
  describe("assertValidTmdbId", () => {
    it("aceita tmdbId inteiro positivo", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidTmdbId(1)).not.toThrow();
      expect(() => UserMovieEntryValidationUtils.assertValidTmdbId(157336)).not.toThrow();
    });

    it("rejeita tmdbId zero", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidTmdbId(0)).toThrow(
        UserMovieEntryValidationException,
      );
      expect(() => UserMovieEntryValidationUtils.assertValidTmdbId(0)).toThrow(
        "tmdbId must be a positive integer, received 0",
      );
    });

    it("rejeita tmdbId negativo", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidTmdbId(-1)).toThrow(
        UserMovieEntryValidationException,
      );
      expect(() => UserMovieEntryValidationUtils.assertValidTmdbId(-100)).toThrow(
        "tmdbId must be a positive integer, received -100",
      );
    });

    it("rejeita tmdbId não inteiro", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidTmdbId(1.5)).toThrow(
        UserMovieEntryValidationException,
      );
    });
  });

  describe("assertValidRating", () => {
    it("aceita rating null ou undefined", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidRating(null)).not.toThrow();
      expect(() => UserMovieEntryValidationUtils.assertValidRating(undefined)).not.toThrow();
    });

    it("aceita rating inteiro entre 1 e 10", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidRating(1)).not.toThrow();
      expect(() => UserMovieEntryValidationUtils.assertValidRating(7)).not.toThrow();
      expect(() => UserMovieEntryValidationUtils.assertValidRating(10)).not.toThrow();
    });

    it("rejeita rating zero", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidRating(0)).toThrow(
        UserMovieEntryValidationException,
      );
      expect(() => UserMovieEntryValidationUtils.assertValidRating(0)).toThrow(
        "rating must be an integer between 1 and 10, received 0",
      );
    });

    it("rejeita rating acima de 10", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidRating(11)).toThrow(
        UserMovieEntryValidationException,
      );
      expect(() => UserMovieEntryValidationUtils.assertValidRating(11)).toThrow(
        "rating must be an integer between 1 and 10, received 11",
      );
    });

    it("rejeita rating negativo e não inteiro", () => {
      expect(() => UserMovieEntryValidationUtils.assertValidRating(-1)).toThrow(
        UserMovieEntryValidationException,
      );
      expect(() => UserMovieEntryValidationUtils.assertValidRating(7.5)).toThrow(
        UserMovieEntryValidationException,
      );
    });
  });

  describe("assertValidPatch", () => {
    it("não valida rating quando a chave não foi enviada", () => {
      const patch: UserMovieEntryPatch = { watched: true };

      expect(() => UserMovieEntryValidationUtils.assertValidPatch(patch)).not.toThrow();
    });

    it("aceita rating null explícito no patch", () => {
      const patch: UserMovieEntryPatch = { rating: null };

      expect(() => UserMovieEntryValidationUtils.assertValidPatch(patch)).not.toThrow();
    });

    it("rejeita rating inválido no patch", () => {
      const patch: UserMovieEntryPatch = { rating: 0 };

      expect(() => UserMovieEntryValidationUtils.assertValidPatch(patch)).toThrow(
        UserMovieEntryValidationException,
      );
    });
  });

  describe("assertValidUpsertInput", () => {
    it("valida tmdbId e rating do patch juntos", () => {
      const patch: UserMovieEntryPatch = { watched: true, rating: 9 };

      expect(() =>
        UserMovieEntryValidationUtils.assertValidUpsertInput(157336, patch),
      ).not.toThrow();
    });

    it("rejeita tmdbId inválido antes de persistir", () => {
      const patch: UserMovieEntryPatch = { watched: true };

      expect(() =>
        UserMovieEntryValidationUtils.assertValidUpsertInput(0, patch),
      ).toThrow(UserMovieEntryValidationException);
    });
  });
});

describe("UserMovieEntryValidationException", () => {
  it("expõe status 400", () => {
    const exception = new UserMovieEntryValidationException("invalid field");

    expect(exception.statusCode).toBe(400);
    expect(exception.message).toBe("invalid field");
  });
});
