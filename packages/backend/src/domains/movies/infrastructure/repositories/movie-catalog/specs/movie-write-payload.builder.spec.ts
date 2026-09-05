import { describe, it, expect } from "vitest";
import type { MovieCatalogDetails } from "../../../../domain/entities/movie-catalog-details.entity";
import { DEFAULT_MOVIE_CATALOG_LANGUAGE } from "../../../../domain/repositories/movie-catalog.repository";
import { MovieCatalogMovieWritePayloadBuilder } from "../movie-write-payload.builder";

class MovieWritePayloadFixtures {
  static baseDetails(overrides: Partial<MovieCatalogDetails> = {}): MovieCatalogDetails {
    return {
      tmdbId: 157336,
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Em busca de um novo lar.",
      runtimeMinutes: 169,
      genres: ["Ficção científica", "Drama"],
      tmdbVoteAverage: 8.4,
      originCountries: ["US"],
      directors: ["Christopher Nolan"],
      cast: ["Matthew McConaughey"],
      watchProviders: {
        flatrate: [{ providerName: "Netflix", logoPath: "/netflix.png" }],
        rent: [],
        buy: [],
      },
      imdbId: "tt0816692",
      ...overrides,
    };
  }
}

describe("MovieCatalogMovieWritePayloadBuilder", () => {
  it("monta escalares com language explícita e imdbId", () => {
    const details = MovieWritePayloadFixtures.baseDetails();

    const scalars = MovieCatalogMovieWritePayloadBuilder.buildScalars(
      details,
      "en-US",
    );

    expect(scalars).toEqual({
      tmdbId: 157336,
      language: "en-US",
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Em busca de um novo lar.",
      runtimeMinutes: 169,
      tmdbVoteAverage: 8.4,
      imdbId: "tt0816692",
    });
  });

  it("inclui imdbId null no payload de gravação", () => {
    const details = MovieWritePayloadFixtures.baseDetails({ imdbId: null });

    const scalars = MovieCatalogMovieWritePayloadBuilder.buildScalars(
      details,
      DEFAULT_MOVIE_CATALOG_LANGUAGE,
    );

    expect(scalars.imdbId).toBeNull();
    expect(scalars.tmdbId).toBe(157336);
  });
});
