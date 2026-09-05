import { describe, it, expect } from "vitest";
import { MovieWatchProviderKind } from "../../../../../../generated/prisma/client.js";
import { MovieCatalogPrismaMapper } from "../movie-catalog-prisma.mapper";

class MovieCatalogPrismaMapperFixtures {
  static movieWithChildren(overrides: Record<string, unknown> = {}) {
    return {
      id: 999,
      tmdbId: 157336,
      language: "pt-BR",
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Em busca de um novo lar.",
      runtimeMinutes: 169,
      tmdbVoteAverage: 8.4,
      imdbId: "tt0816692",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      genres: [{ id: 1, name: "Ficção científica", movieId: 999 }],
      directors: [{ id: 1, name: "Christopher Nolan", movieId: 999 }],
      cast: [
        { id: 1, name: "Matthew McConaughey", sortOrder: 0, movieId: 999 },
        { id: 2, name: "Anne Hathaway", sortOrder: 1, movieId: 999 },
      ],
      originCountries: [{ id: 1, code: "US", movieId: 999 }],
      watchProviders: [
        {
          id: 1,
          kind: MovieWatchProviderKind.flatrate,
          providerName: "Netflix",
          logoPath: "/netflix.png",
          movieId: 999,
        },
        {
          id: 2,
          kind: MovieWatchProviderKind.rent,
          providerName: "Apple TV",
          logoPath: null,
          movieId: 999,
        },
      ],
      ...overrides,
    };
  }
}

describe("MovieCatalogPrismaMapper", () => {
  it("mapeia row Prisma para MovieCatalogDetails com tmdbId TMDB, não id interno", () => {
    const row = MovieCatalogPrismaMapperFixtures.movieWithChildren();

    const details = MovieCatalogPrismaMapper.toDetails(row);

    expect(details.tmdbId).toBe(157336);
    expect(details.tmdbId).not.toBe(row.id);
    expect(details).toMatchObject({
      title: "Interestelar",
      year: 2014,
      imdbId: "tt0816692",
      genres: ["Ficção científica"],
      directors: ["Christopher Nolan"],
      originCountries: ["US"],
    });
  });

  it("ordena elenco por sortOrder e depois por nome", () => {
    const row = MovieCatalogPrismaMapperFixtures.movieWithChildren({
      cast: [
        { id: 1, name: "Zoe", sortOrder: 1, movieId: 999 },
        { id: 2, name: "Anne Hathaway", sortOrder: 0, movieId: 999 },
        { id: 3, name: "Bob", sortOrder: 1, movieId: 999 },
      ],
    });

    const details = MovieCatalogPrismaMapper.toDetails(row);

    expect(details.cast).toEqual(["Anne Hathaway", "Bob", "Zoe"]);
  });

  it("agrupa watch providers por kind", () => {
    const row = MovieCatalogPrismaMapperFixtures.movieWithChildren();

    const details = MovieCatalogPrismaMapper.toDetails(row);

    expect(details.watchProviders).toEqual({
      flatrate: [{ providerName: "Netflix", logoPath: "/netflix.png" }],
      rent: [{ providerName: "Apple TV", logoPath: null }],
      buy: [],
    });
  });

  it("preserva imdbId null na leitura", () => {
    const row = MovieCatalogPrismaMapperFixtures.movieWithChildren({ imdbId: null });

    const details = MovieCatalogPrismaMapper.toDetails(row);

    expect(details.imdbId).toBeNull();
  });
});
