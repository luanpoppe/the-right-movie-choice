import { describe, expect, it } from "vitest";
import {
  MOVIE_QUERY_EXAMPLES_COUNT,
  MovieQueryExamplesSchema,
  MovieQueryExamplesSchemaFactory,
} from "../movie-query-examples.entity";

class MovieQueryExamplesSchemaFixtures {
  static threeExamples() {
    return {
      queryExamples: [
        { queryExample: "80s action movies with strong female leads" },
        { queryExample: "cozy rainy-night anime to watch with a friend" },
        { queryExample: "short sci-fi about time travel" },
      ],
    };
  }
}

describe("MovieQueryExamplesSchema", () => {
  it("aceita exatamente três exemplos", () => {
    const parsed = MovieQueryExamplesSchema.safeParse(
      MovieQueryExamplesSchemaFixtures.threeExamples(),
    );

    expect(MOVIE_QUERY_EXAMPLES_COUNT).toBe(3);
    expect(parsed.success).toBe(true);
  });

  it("factory createUpTo aceita lote parcial até o máximo (20 de 25)", () => {
    const batchSchema = MovieQueryExamplesSchemaFactory.createUpTo(25);
    const partialBatch = {
      queryExamples: Array.from({ length: 20 }, (_, index) => ({
        queryExample: `Suggestion ${index + 1}`,
      })),
    };

    const parsed = batchSchema.safeParse(partialBatch);

    expect(parsed.success).toBe(true);
  });

  it("factory createUpTo rejeita lote vazio ou acima do máximo", () => {
    const batchSchema = MovieQueryExamplesSchemaFactory.createUpTo(25);
    const emptyBatch = { queryExamples: [] };
    const oversizedBatch = {
      queryExamples: Array.from({ length: 26 }, (_, index) => ({
        queryExample: `Suggestion ${index + 1}`,
      })),
    };

    expect(batchSchema.safeParse(emptyBatch).success).toBe(false);
    expect(batchSchema.safeParse(oversizedBatch).success).toBe(false);
  });

  it("rejeita quantidade diferente de três", () => {
    const twoExamples = {
      queryExamples: [
        { queryExample: "80s action movies with strong female leads" },
        { queryExample: "short sci-fi about time travel" },
      ],
    };

    const parsed = MovieQueryExamplesSchema.safeParse(twoExamples);

    expect(parsed.success).toBe(false);
  });
});
