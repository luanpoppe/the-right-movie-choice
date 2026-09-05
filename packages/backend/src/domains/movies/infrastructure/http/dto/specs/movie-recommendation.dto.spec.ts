import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SingleMovieReccomendationSchema } from "@/domains/movies/domain/entities/movie-recommendation.entity";
import {
  MovieRecommendationResponseDTOSchema,
} from "../movie-recommendation.dto";

class MovieRecommendationDtoFixtures {
  static publicMovie() {
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
}

class MovieRecommendationDtoSource {
  static read() {
    const dtoPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/http/dto/movie-recommendation.dto.ts",
    );
    return readFileSync(dtoPath, "utf8");
  }
}

describe("MovieRecommendationResponseDTO", () => {
  it("não reutiliza SingleMovieReccomendationInternalSchema no DTO", () => {
    const source = MovieRecommendationDtoSource.read();

    expect(source).toContain("SingleMovieReccomendationSchema");
    expect(source).not.toContain("SingleMovieReccomendationInternalSchema");
    expect(source).not.toContain("MovieRecommendationSchema");
  });

  it("usa apenas schema público nos filmes da resposta", () => {
    const publicMovie = MovieRecommendationDtoFixtures.publicMovie();
    const movieWithInternalIds = {
      ...publicMovie,
      tmdbId: 27205,
      imdbId: "tt1375666",
    };

    const parsed = MovieRecommendationResponseDTOSchema.parse({
      movies: [movieWithInternalIds],
      response: "Sugestão.",
    });

    expect(parsed.movies[0]).toEqual(publicMovie);
    expect(parsed.movies[0]).not.toHaveProperty("tmdbId");
    expect(parsed.movies[0]).not.toHaveProperty("imdbId");
    expect(SingleMovieReccomendationSchema).toBe(
      MovieRecommendationResponseDTOSchema.shape.movies.element,
    );
  });
});
