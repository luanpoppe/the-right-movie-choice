import { describe, expect, it } from "vitest";
import { MovieRecommendationPrompts } from "../movie-recommendation-prompts";

describe("MovieRecommendationPrompts", () => {
  it("returns a unified prompt with card fields and conversational tone", () => {
    const prompt = MovieRecommendationPrompts.unified();

    expect(prompt).toContain("até 03 filmes");
    expect(prompt).toContain("nota do filme no IMDb");
    expect(prompt).toContain("campo response");
    expect(prompt).toContain("não responda em markdown");
    expect(prompt).toContain("zero filmes");
    expect(prompt).not.toContain("já foi feito por outra IA");
    expect(prompt).not.toContain("Filmes sugeridos:");
  });
});
