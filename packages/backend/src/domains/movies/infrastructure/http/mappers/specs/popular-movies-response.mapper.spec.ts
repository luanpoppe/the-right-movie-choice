import { describe, it, expect } from "vitest";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { PopularMoviesResponseMapper } from "../popular-movies-response.mapper";

function details(overrides: Partial<MovieCatalogDetails> = {}): MovieCatalogDetails {
  return {
    tmdbId: 157336,
    title: "Interestelar",
    year: 2014,
    posterPath: "/poster.jpg",
    overview: "Sinopse",
    runtimeMinutes: 169,
    genres: ["Ficção científica"],
    tmdbVoteAverage: 8.4,
    originCountries: ["US"],
    directors: ["Christopher Nolan"],
    cast: ["Matthew McConaughey"],
    watchProviders: { flatrate: [], rent: [], buy: [] },
    imdbId: "tt0816692",
    ...overrides,
  };
}

describe("PopularMoviesResponseMapper", () => {
  it("mapeia os detalhes para o DTO de populares", () => {
    const response = PopularMoviesResponseMapper.toResponse([details()]);

    expect(response.movies).toHaveLength(1);
    const movie = response.movies[0];
    expect(movie.tmdbId).toBe(157336);
    expect(movie.title).toBe("Interestelar");
    expect(movie.year).toBe(2014);
    expect(movie.runtimeMinutes).toBe(169);
    expect(movie.voteAverage).toBe(8.4);
    expect(movie.directors).toEqual(["Christopher Nolan"]);
    expect(movie.posterPath).toContain("poster.jpg");
  });

  it("mantém posterPath nulo quando não há capa", () => {
    const response = PopularMoviesResponseMapper.toResponse([
      details({ posterPath: null }),
    ]);

    expect(response.movies[0].posterPath).toBeNull();
  });

  it("devolve lista vazia quando não há filmes", () => {
    const response = PopularMoviesResponseMapper.toResponse([]);

    expect(response).toEqual({ movies: [] });
  });
});
