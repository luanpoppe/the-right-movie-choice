import { MovieCardWatchedModalUtils } from "../movie-card-watched-modal.utils";

const INVALID_RATING_MESSAGE = "Rating must be an integer between 1 and 10";
const WATCHED_AT_ISO = "2026-03-15T00:00:00.000Z";

describe("MovieCardWatchedModalUtils", () => {
  describe("toDateInputValue", () => {
    it("REQ-7: reduz ISO com hora para a data do dia", () => {
      expect(
        MovieCardWatchedModalUtils.toDateInputValue(
          "2026-03-15T03:00:00.000Z",
        ),
      ).toBe("2026-03-15");
    });

    it("REQ-7: mantém valor já sem hora", () => {
      expect(
        MovieCardWatchedModalUtils.toDateInputValue("2026-03-15"),
      ).toBe("2026-03-15");
    });

    it("REQ-7: data nula ou vazia vira campo vazio", () => {
      expect(MovieCardWatchedModalUtils.toDateInputValue(null)).toBe("");
      expect(MovieCardWatchedModalUtils.toDateInputValue("")).toBe("");
    });
  });

  describe("parseWatchedAt", () => {
    it("REQ-7: data do input vira ISO na meia-noite UTC", () => {
      expect(MovieCardWatchedModalUtils.parseWatchedAt("2026-03-15")).toBe(
        WATCHED_AT_ISO,
      );
    });

    it("REQ-7: campo vazio vira null", () => {
      expect(MovieCardWatchedModalUtils.parseWatchedAt("")).toBeNull();
      expect(MovieCardWatchedModalUtils.parseWatchedAt("   ")).toBeNull();
    });

    it("remove espaços ao redor antes de montar o ISO", () => {
      expect(MovieCardWatchedModalUtils.parseWatchedAt(" 2026-03-15 ")).toBe(
        WATCHED_AT_ISO,
      );
    });
  });

  describe("readRating", () => {
    it.each(["", "   "])(
      "classifica nota vazia (%j) como empty",
      (ratingInput) => {
        expect(
          MovieCardWatchedModalUtils.readRating(ratingInput),
        ).toEqual({ status: "empty" });
      },
    );

    it.each([
      [1, "1"],
      [7, "7"],
      [8, " 8 "],
      [10, "10"],
    ])("classifica %j como nota válida %d", (expectedRating, ratingInput) => {
      expect(MovieCardWatchedModalUtils.readRating(ratingInput)).toEqual({
        status: "valid",
        rating: expectedRating,
      });
    });

    it.each(["0", "11", "abc", "8.5", "-1"])(
      "classifica %j como nota inválida",
      (ratingInput) => {
        expect(
          MovieCardWatchedModalUtils.readRating(ratingInput),
        ).toEqual({ status: "invalid" });
      },
    );
  });

  describe("buildSavePatch", () => {
    it("REQ-2: edição com nota e data válidas envia os dois valores", () => {
      const result = MovieCardWatchedModalUtils.buildSavePatch({
        isEditing: true,
        ratingInput: "8",
        dateInput: "2026-03-15",
      });

      expect(result).toEqual({
        ok: true,
        patch: {
          watched: true,
          rating: 8,
          watchedAt: WATCHED_AT_ISO,
        },
      });
    });

    it("REQ-3: edição com campos vazios limpa nota e data", () => {
      const result = MovieCardWatchedModalUtils.buildSavePatch({
        isEditing: true,
        ratingInput: "",
        dateInput: "",
      });

      expect(result).toEqual({
        ok: true,
        patch: { watched: true, rating: null, watchedAt: null },
      });
    });

    it("REQ-6: edição com nota fora de 1–10 bloqueia o save", () => {
      const result = MovieCardWatchedModalUtils.buildSavePatch({
        isEditing: true,
        ratingInput: "11",
        dateInput: "2026-03-15",
      });

      expect(result).toEqual({ ok: false, error: INVALID_RATING_MESSAGE });
    });

    it("REQ-6: nota inválida bloqueia o save também na criação", () => {
      const result = MovieCardWatchedModalUtils.buildSavePatch({
        isEditing: false,
        ratingInput: "abc",
        dateInput: "",
      });

      expect(result).toEqual({ ok: false, error: INVALID_RATING_MESSAGE });
    });

    it("criação com campos vazios omite nota e data do patch", () => {
      const result = MovieCardWatchedModalUtils.buildSavePatch({
        isEditing: false,
        ratingInput: "",
        dateInput: "",
      });

      expect(result).toEqual({ ok: true, patch: { watched: true } });
    });

    it("criação com apenas nota omite a data", () => {
      const result = MovieCardWatchedModalUtils.buildSavePatch({
        isEditing: false,
        ratingInput: "7",
        dateInput: "",
      });

      expect(result).toEqual({
        ok: true,
        patch: { watched: true, rating: 7 },
      });
    });

    it("criação com apenas data omite a nota", () => {
      const result = MovieCardWatchedModalUtils.buildSavePatch({
        isEditing: false,
        ratingInput: "",
        dateInput: "2026-03-15",
      });

      expect(result).toEqual({
        ok: true,
        patch: { watched: true, watchedAt: WATCHED_AT_ISO },
      });
    });
  });

  describe("buildDeletePatch", () => {
    it("REQ-4: deletar envia watched false com nota e data nulas", () => {
      expect(MovieCardWatchedModalUtils.buildDeletePatch()).toEqual({
        watched: false,
        rating: null,
        watchedAt: null,
      });
    });
  });
});
