import { describe, expect, it } from "vitest";
import { MovieRecommendationPrompts } from "../movie-recommendation-prompts";

describe("MovieRecommendationPrompts", () => {
  it("returns the structured recommendation system prompt", () => {
    const prompt = MovieRecommendationPrompts.structured();

    expect(prompt).toContain("indicar 03 filmes");
    expect(prompt).toContain("nota do filme no IMDb");
  });

  it("interpolates the movies JSON into the chat system prompt", () => {
    const moviesJson = '{"movies":[{"title":"Inception"}]}';

    const prompt = MovieRecommendationPrompts.chat(moviesJson);

    expect(prompt).toContain("Filmes sugeridos: " + moviesJson);
    expect(prompt).toContain("não responda em markdown");
  });
});
