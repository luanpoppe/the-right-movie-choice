import { describe, expect, it } from "vitest";
import { MovieQueryExamplesPrompts } from "../movie-query-examples-prompts";

describe("MovieQueryExamplesPrompts", () => {
  it("expõe temperature 1.2 como constante nomeada", () => {
    expect(MovieQueryExamplesPrompts.QUERY_EXAMPLES_TEMPERATURE).toBe(1.2);
  });

  it("devolve o prompt de três queries criativas em inglês no schema queryExamples", () => {
    const prompt = MovieQueryExamplesPrompts.text();

    expect(prompt).toContain("exatamente 3 exemplos");
    expect(prompt).toContain("em inglês");
    expect(prompt).toContain("queryExamples");
    expect(prompt).toContain("queryExample");
    expect(prompt).toContain("The Right Movie Choice");
  });

  it("textForBatch usa count variável e lista textos existentes com casing original", () => {
    const prompt = MovieQueryExamplesPrompts.textForBatch(25, [
      "Sci-Fi movies from the 90s",
      "Action movies with a twist",
    ]);

    expect(prompt).toContain("exatamente 25 exemplos");
    expect(prompt).toContain("Sci-Fi movies from the 90s");
    expect(prompt).toContain("Action movies with a twist");
    expect(prompt).toContain("já estão no pool");
  });
});
