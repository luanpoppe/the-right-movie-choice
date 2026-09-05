import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MovieRecommendationPrompts } from "../movie-recommendation-prompts";

class MovieRecommendationPromptsSource {
  static read() {
    const promptsPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/providers/movie-recommendation-prompts.ts",
    );
    return readFileSync(promptsPath, "utf8");
  }
}

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

  it("expõe só unified na API — sem structured nem chat", () => {
    const staticNames = Object.getOwnPropertyNames(MovieRecommendationPrompts).filter(
      (name) => name !== "length" && name !== "name" && name !== "prototype",
    );
    const source = MovieRecommendationPromptsSource.read();

    expect(staticNames).toEqual(["unified"]);
    expect(source).not.toMatch(/static structured\s*\(/);
    expect(source).not.toMatch(/static chat\s*\(/);
    expect(typeof MovieRecommendationPrompts.unified).toBe("function");
  });
});
