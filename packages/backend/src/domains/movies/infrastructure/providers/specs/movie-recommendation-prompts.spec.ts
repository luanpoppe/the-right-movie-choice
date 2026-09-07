import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ExcludeWatchedRecommendationConstants } from "@/domains/movies/domain/exclude-watched-recommendation.constants";
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

  it("instrui espelhar idioma da ultima mensagem do usuario e separar do catalogo", () => {
    const prompt = MovieRecommendationPrompts.unified();

    expect(prompt).toContain("última mensagem do usuário");
    expect(prompt).toContain("Nunca responda em português apenas porque o catálogo");
    expect(prompt).toContain("somente lookupMovies");
    expect(prompt).toContain("não copie o título localizado em português");
    expect(prompt).toContain("prefira títulos em inglês");
  });

  it("ensina query em pt-BR, year separado e ordem estável dos resultados", () => {
    const prompt = MovieRecommendationPrompts.unified();

    expect(prompt).toContain("português do Brasil");
    expect(prompt).toContain("Não cole o ano no texto da query");
    expect(prompt).toContain("mesma ordem das queries");
    expect(prompt).toContain("mesma posição");
    expect(prompt).toContain("details.tmdbId e details.imdbId");
  });

  it("expõe unified e unifiedExcludeWatched na API — sem structured nem chat", () => {
    const staticNames = Object.getOwnPropertyNames(MovieRecommendationPrompts).filter(
      (name) => name !== "length" && name !== "name" && name !== "prototype",
    );
    const source = MovieRecommendationPromptsSource.read();

    expect(staticNames).toEqual(["unified", "unifiedExcludeWatched"]);
    expect(source).not.toMatch(/static structured\s*\(/);
    expect(source).not.toMatch(/static chat\s*\(/);
    expect(typeof MovieRecommendationPrompts.unified).toBe("function");
    expect(typeof MovieRecommendationPrompts.unifiedExcludeWatched).toBe("function");
  });

  describe("unifiedExcludeWatched", () => {
    const poolSize = ExcludeWatchedRecommendationConstants.CANDIDATE_POOL_SIZE;
    const minVerifiedUnwatched = ExcludeWatchedRecommendationConstants.MIN_VERIFIED_UNWATCHED;

    it("menciona pool de candidatos ampliado usando constante", () => {
      const prompt = MovieRecommendationPrompts.unifiedExcludeWatched();

      expect(prompt).toContain(`até ${poolSize} candidatos relevantes`);
      expect(prompt).toContain(`Envie entre 1 e ${poolSize} itens`);
      expect(poolSize).toBe(25);
    });

    it("instrui mínimo de filmes verificados não assistidos usando constante", () => {
      const prompt = MovieRecommendationPrompts.unifiedExcludeWatched();

      expect(prompt).toContain(
        `prefira pelo menos ${minVerifiedUnwatched} filmes com tmdbId confirmado`,
      );
      expect(minVerifiedUnwatched).toBe(2);
    });

    it("explica filtro de assistidos e rede ampla de candidatos", () => {
      const prompt = MovieRecommendationPrompts.unifiedExcludeWatched();

      expect(prompt).toContain("remove automaticamente do resultado obras que o usuário já assistiu");
      expect(prompt).toContain("Lance uma rede ampla");
      expect(prompt).toContain("não as sugira novamente");
    });

    it("mantém exatamente uma chamada lookupMovies por resposta", () => {
      const prompt = MovieRecommendationPrompts.unifiedExcludeWatched();

      expect(prompt).toContain("chame a tool lookupMovies exatamente uma vez");
      expect(prompt).toContain(
        "Não chame lookupMovies novamente para tentar corrigir, complementar ou substituir resultados da primeira chamada",
      );
    });

    it("diferencia-se de unified na quantidade de candidatos", () => {
      const unifiedPrompt = MovieRecommendationPrompts.unified();
      const excludePrompt = MovieRecommendationPrompts.unifiedExcludeWatched();

      expect(unifiedPrompt).toContain("entre 4 e 8 candidatos");
      expect(unifiedPrompt).toContain("Envie entre 1 e 8 itens");
      expect(excludePrompt).not.toContain("entre 4 e 8 candidatos");
      expect(excludePrompt).not.toContain("Envie entre 1 e 8 itens");
      expect(excludePrompt).toContain(`até ${poolSize} candidatos relevantes`);
    });
  });
});
