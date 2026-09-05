import { describe, expect, it } from "vitest";
import {
  MovieRecommendationSchema,
  SingleMovieReccomendationInternalSchema,
} from "../movie-recommendation.entity";

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

  it("REQ-2: aceita filme com tmdbId e imdbId opcionais", () => {
    const movie = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      tmdbId: 27205,
      imdbId: "tt1375666",
    };
    const payload = {
      movies: [movie],
      response: "Filme com ids do catálogo.",
    };

    const parseResult = MovieRecommendationSchema.safeParse(payload);

    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.movies[0]?.tmdbId).toBe(27205);
      expect(parseResult.data.movies[0]?.imdbId).toBe("tt1375666");
    }
  });

  it("REQ-2: aceita filme sem tmdbId nem imdbId após miss no catálogo", () => {
    const movie = MovieRecommendationEntityFixtures.singleMovie();
    const payload = {
      movies: [movie],
      response: "Sugestão sem ids porque o catálogo não encontrou.",
    };

    const parseResult = MovieRecommendationSchema.safeParse(payload);

    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.movies[0]).not.toHaveProperty("tmdbId");
      expect(parseResult.data.movies[0]).not.toHaveProperty("imdbId");
    }
  });

  it("REQ-2: aceita filme só com tmdbId sem imdbId", () => {
    const movie = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      tmdbId: 603,
    };
    const parseResult = SingleMovieReccomendationInternalSchema.safeParse(movie);

    expect(parseResult.success).toBe(true);
  });
});
