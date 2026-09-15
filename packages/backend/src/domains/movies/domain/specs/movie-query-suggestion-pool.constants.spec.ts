import { describe, expect, it } from "vitest";
import { MovieQuerySuggestionPoolConstants } from "../movie-query-suggestion-pool.constants";

describe("MovieQuerySuggestionPoolConstants", () => {
  it("REQ-2: limita seed a no máximo 4 chamadas IA de 25 itens", () => {
    expect(MovieQuerySuggestionPoolConstants.POOL_SIZE).toBe(100);
    expect(MovieQuerySuggestionPoolConstants.SEED_BATCH_SIZE).toBe(25);
    expect(MovieQuerySuggestionPoolConstants.SEED_MAX_CALLS_PER_RUN).toBe(4);
    expect(MovieQuerySuggestionPoolConstants.SEED_IA_MAX_RETRIES).toBe(3);
  });
});
