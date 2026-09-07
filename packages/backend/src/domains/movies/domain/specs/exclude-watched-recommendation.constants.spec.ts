import { describe, expect, it } from "vitest";
import { ExcludeWatchedRecommendationConstants } from "../exclude-watched-recommendation.constants";

describe("ExcludeWatchedRecommendationConstants", () => {
  it("define pool de candidatos com 25 títulos", () => {
    expect(ExcludeWatchedRecommendationConstants.CANDIDATE_POOL_SIZE).toBe(25);
  });

  it("exige ao menos 2 títulos não assistidos verificados", () => {
    expect(ExcludeWatchedRecommendationConstants.MIN_VERIFIED_UNWATCHED).toBe(2);
  });

  it("limita a 5 rodadas de exclusão", () => {
    expect(ExcludeWatchedRecommendationConstants.MAX_EXCLUDE_ROUNDS).toBe(5);
  });

  it("define 8 consultas de lookup no modo normal sem exclude", () => {
    expect(ExcludeWatchedRecommendationConstants.DEFAULT_MAX_LOOKUP_QUERIES).toBe(
      8,
    );
  });
});
