import { describe, expect, it } from "vitest";
import {
  MOVIE_QUERY_EXAMPLES_COUNT,
  MovieQueryExamplesSchema,
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
