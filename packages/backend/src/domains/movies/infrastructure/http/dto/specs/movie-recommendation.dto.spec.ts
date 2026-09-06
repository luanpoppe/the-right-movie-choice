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
    const movieWithCatalogIds = {
      ...publicMovie,
      tmdbId: 27205,
      imdbId: "tt1375666",
    };

    const parsed = MovieRecommendationResponseDTOSchema.parse({
      movies: [movieWithCatalogIds],
      response: "Sugestão.",
    });

    expect(parsed.movies[0]).toEqual(movieWithCatalogIds);
    expect(SingleMovieReccomendationSchema).toBe(
      MovieRecommendationResponseDTOSchema.shape.movies.element,
    );
  });

  it("REQ-2: omite tmdbId e imdbId quando ausentes no payload", () => {
    const publicMovie = MovieRecommendationDtoFixtures.publicMovie();

    const parsed = MovieRecommendationResponseDTOSchema.parse({
      movies: [publicMovie],
      response: "Sugestão sem catálogo.",
    });

    expect(parsed.movies[0]).toEqual(publicMovie);
    expect(parsed.movies[0]).not.toHaveProperty("tmdbId");
    expect(parsed.movies[0]).not.toHaveProperty("imdbId");
  });

  it("REQ-4: aceita tmdbId sem imdbId no schema público", () => {
    const publicMovie = MovieRecommendationDtoFixtures.publicMovie();
    const movieWithTmdbOnly = {
      ...publicMovie,
      tmdbId: 603,
    };

    const parsed = MovieRecommendationResponseDTOSchema.parse({
      movies: [movieWithTmdbOnly],
      response: "Só TMDB.",
    });

    expect(parsed.movies[0]).toMatchObject({ tmdbId: 603 });
    expect(parsed.movies[0]).not.toHaveProperty("imdbId");
  });

  it("REQ-5: rejeita tmdbId zero no schema público", () => {
    const publicMovie = MovieRecommendationDtoFixtures.publicMovie();
    const movieWithInvalidTmdbId = {
      ...publicMovie,
      tmdbId: 0,
    };

    const parseResult = MovieRecommendationResponseDTOSchema.safeParse({
      movies: [movieWithInvalidTmdbId],
      response: "TMDB inválido.",
    });

    expect(parseResult.success).toBe(false);
  });

  it("aceita tmdbId como string numerica via coerce", () => {
    const publicMovie = MovieRecommendationDtoFixtures.publicMovie();
    const movieWithStringTmdbId = {
      ...publicMovie,
      tmdbId: "27205",
    };

    const parsed = MovieRecommendationResponseDTOSchema.parse({
      movies: [movieWithStringTmdbId],
      response: "TMDB como string.",
    });

    expect(parsed.movies[0]?.tmdbId).toBe(27205);
  });

  it("rejeita imdbId string vazia", () => {
    const publicMovie = MovieRecommendationDtoFixtures.publicMovie();
    const movieWithEmptyImdbId = {
      ...publicMovie,
      imdbId: "",
    };

    const parseResult = MovieRecommendationResponseDTOSchema.safeParse({
      movies: [movieWithEmptyImdbId],
      response: "IMDb vazio.",
    });

    expect(parseResult.success).toBe(false);
  });
});
