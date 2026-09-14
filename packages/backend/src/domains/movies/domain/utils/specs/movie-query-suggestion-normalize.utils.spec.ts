import { describe, expect, it } from "vitest";
import { MovieQuerySuggestionNormalizeUtils } from "../movie-query-suggestion-normalize.utils";

describe("MovieQuerySuggestionNormalizeUtils", () => {
  describe("normalize", () => {
    it("REQ-4: trim nas pontas e preserva casing em text", () => {
      const result = MovieQuerySuggestionNormalizeUtils.normalize(
        "  Sci-Fi movies from the 90s  ",
      );

      expect(result.text).toBe("Sci-Fi movies from the 90s");
      expect(result.textNormalized).toBe("sci-fi movies from the 90s");
    });

    it("REQ-5: textNormalized é trim + lowercase para dedup", () => {
      const result = MovieQuerySuggestionNormalizeUtils.normalize(
        "Action movies with a twist",
      );

      expect(result.text).toBe("Action movies with a twist");
      expect(result.textNormalized).toBe("action movies with a twist");
    });

    it("text vazio após trim gera campos vazios", () => {
      const result = MovieQuerySuggestionNormalizeUtils.normalize("   ");

      expect(result.text).toBe("");
      expect(result.textNormalized).toBe("");
    });
  });
});
