import { describe, expect, it } from "vitest";
import { MovieRecommendationSchema } from "../movie-recommendation.entity";

class MovieRecommendationEntityFixtures {
  static singleMovie() {
    return {
      title: "Inception",
      director: "Christopher Nolan",
      actors: ["Leonardo DiCaprio"],
      releaseYear: 2010,
      streamingPlatform: "Netflix",
      imdbRating: 8.8,
      synopsis: "A thief who steals corporate secrets through dream-sharing.",
      whySuggestion: "Fits a mind-bending request",
      durationInMinutes: 148,
    };
  }

  static movies(count: number) {
    const template = MovieRecommendationEntityFixtures.singleMovie();
    return Array.from({ length: count }, () => ({ ...template }));
  }
}

describe("MovieRecommendationSchema", () => {
  it("aceita lista vazia de filmes com response não vazia", () => {
    const payload = {
      movies: [],
      response: "Nenhum filme encontrado, mas aqui vai uma sugestão em texto.",
    };

    const parseResult = MovieRecommendationSchema.safeParse(payload);

    expect(parseResult.success).toBe(true);
  });

  it("rejeita mais de 3 filmes", () => {
    const movies = MovieRecommendationEntityFixtures.movies(4);
    const payload = {
      movies,
      response: "Quatro sugestões.",
    };

    const parseResult = MovieRecommendationSchema.safeParse(payload);

    expect(parseResult.success).toBe(false);
  });

  it("rejeita response vazia", () => {
    const movies = MovieRecommendationEntityFixtures.movies(1);
    const payload = {
      movies,
      response: "",
    };

    const parseResult = MovieRecommendationSchema.safeParse(payload);

    expect(parseResult.success).toBe(false);
  });

  it("rejeita payload sem o campo response", () => {
    const movies = MovieRecommendationEntityFixtures.movies(1);
    const payload = { movies };

    const parseResult = MovieRecommendationSchema.safeParse(payload);

    expect(parseResult.success).toBe(false);
  });

  it("aceita 3 filmes com response preenchida", () => {
    const movies = MovieRecommendationEntityFixtures.movies(3);
    const payload = {
      movies,
      response: "Três filmes que combinam com o pedido.",
    };

    const parseResult = MovieRecommendationSchema.safeParse(payload);

    expect(parseResult.success).toBe(true);
  });
});
