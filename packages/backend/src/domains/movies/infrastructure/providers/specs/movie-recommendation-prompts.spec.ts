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

    expect(prompt).toContain("zero a três filmes");
    expect(prompt).toContain("imdbRating");
    expect(prompt).toContain("campo response");
    expect(prompt).toContain("Não use Markdown");
    expect(prompt).toContain("zero filmes");
    expect(prompt).not.toContain("já foi feito por outra IA");
    expect(prompt).not.toContain("Filmes sugeridos:");
    expect(prompt).toContain("lookupMovies");
    expect(prompt).toContain("{ queries: [{ query, year? }] }");
    expect(prompt).toContain("tmdbId");
    expect(prompt).toContain("imdbId");
    expect(prompt).toContain("found: true");
    expect(prompt).toContain("found: false");
    expect(prompt).toMatch(/exatamente uma vez/i);
    expect(prompt).toContain("entre 4 e 8 candidatos");
    expect(prompt).toContain("Nunca invente, estime, deduza ou altere tmdbId ou imdbId");
    expect(prompt).toContain("não inclua tmdbId nem imdbId");
  });

  it("REQ-4: instrui mais candidatos, uma chamada lookupMovies e cópia de ids", () => {
    const prompt = MovieRecommendationPrompts.unified();

    expect(prompt).toMatch(/mais títulos candidatos/i);
    expect(prompt).toContain("chame a tool lookupMovies exatamente uma vez");
    expect(prompt).toContain("copie details.tmdbId para tmdbId");
    expect(prompt).toContain("details.imdbId para imdbId");
    expect(prompt).toContain("Não use Markdown");
  });

  it("ensina query em pt-BR, year separado e ordem estável dos resultados", () => {
    const prompt = MovieRecommendationPrompts.unified();

    expect(prompt).toContain("português do Brasil");
    expect(prompt).toContain("Não cole o ano no texto da query");
    expect(prompt).toContain("mesma ordem das queries");
    expect(prompt).toContain("mesma posição");
    expect(prompt).toContain("details.tmdbId e details.imdbId");
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
