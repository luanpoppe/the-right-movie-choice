import { describe, expect, it } from "vitest";
import { MovieQueryExamplesPrompts } from "../movie-query-examples-prompts";

describe("MovieQueryExamplesPrompts", () => {
  it("expõe temperature 1.5 como constante nomeada", () => {
    expect(MovieQueryExamplesPrompts.QUERY_EXAMPLES_TEMPERATURE).toBe(1.5);
  });

  it("devolve o prompt humano de três queries criativas em inglês", () => {
    const prompt = MovieQueryExamplesPrompts.text();

    expect(prompt).toContain("lista de 03 queries");
    expect(prompt).toContain("em inglês");
    expect(prompt).toContain("Crie novas buscas");
  });
});
