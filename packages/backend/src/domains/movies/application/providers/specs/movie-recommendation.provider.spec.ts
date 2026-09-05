import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

class MovieRecommendationProviderSource {
  static read() {
    const providerPath = path.join(
      process.cwd(),
      "src/domains/movies/application/providers/movie-recommendation.provider.ts",
    );
    return readFileSync(providerPath, "utf8");
  }
}

describe("IMovieRecommendationProvider", () => {
  it("declara só getMovieRecommendation(userMessage, chatId)", () => {
    const source = MovieRecommendationProviderSource.read();

    expect(source).toMatch(/getMovieRecommendation\s*\(\s*userMessage:\s*string,\s*chatId:\s*string/);
    expect(source).toMatch(/Promise<MovieRecommendationEntity>/);
    expect(source).not.toMatch(/getStructuredMoviesRecommendation/);
    expect(source).not.toMatch(/getChatResponse/);
  });
});
