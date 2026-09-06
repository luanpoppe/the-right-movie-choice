import { describe, expect, it, vi } from "vitest";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import type { SingleMovieReccomendationInternalEntity } from "@/domains/movies/domain/entities/movie-recommendation.entity";
import { MovieRecommendationResponseMapper } from "../movie-recommendation-response.mapper";

const INTERNAL_MOVIE: SingleMovieReccomendationInternalEntity = {
  title: "Inception",
  director: "Christopher Nolan",
  actors: ["Leonardo DiCaprio"],
  releaseYear: 2010,
  streamingPlatform: "Netflix",
  imdbRating: 8.8,
  synopsis: "A thief who steals corporate secrets through dream-sharing technology.",
  whySuggestion: "Mind-bending plot that matches your taste.",
  durationInMinutes: 148,
  tmdbId: 27205,
  imdbId: "tt1375666",
};

function createCatalogRepositoryMock(): IMovieCatalogRepository {
  return {
    upsert: vi.fn(),
    findByTmdbId: vi.fn(),
    findByTitleAndYear: vi.fn(),
    findByTitlesAndYears: vi.fn(),
  };
}

describe("MovieRecommendationResponseMapper", () => {
  it("enriquece filme com posterPath quando catálogo tem poster", async () => {
    const catalogRepository = createCatalogRepositoryMock();
    vi.mocked(catalogRepository.findByTmdbId).mockResolvedValue({
      details: {
        tmdbId: 27205,
        title: "Inception",
        year: 2010,
        posterPath: "/poster.jpg",
        overview: "Dreams.",
        runtimeMinutes: 148,
        genres: ["Sci-Fi"],
        tmdbVoteAverage: 8.8,
        originCountries: ["US"],
        directors: ["Christopher Nolan"],
        cast: ["Leonardo DiCaprio"],
        watchProviders: { flatrate: [], rent: [], buy: [] },
        imdbId: "tt1375666",
      },
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const mapper = new MovieRecommendationResponseMapper(catalogRepository);

    const response = await mapper.toResponse(
      [INTERNAL_MOVIE],
      "Here is a great pick for you.",
    );

    expect(response.movies[0]?.posterPath).toBe(
      "https://image.tmdb.org/t/p/w500/poster.jpg",
    );
    expect(response.movies[0]).toMatchObject({
      tmdbId: INTERNAL_MOVIE.tmdbId,
      imdbId: INTERNAL_MOVIE.imdbId,
    });
  });

  it("retorna posterPath null quando filme não tem tmdbId", async () => {
    const { tmdbId: _tmdbId, imdbId: _imdbId, ...movieWithoutIds } =
      INTERNAL_MOVIE;
    const catalogRepository = createCatalogRepositoryMock();
    const mapper = new MovieRecommendationResponseMapper(catalogRepository);

    const response = await mapper.toResponse(
      [movieWithoutIds],
      "Recommendation without catalog ids.",
    );

    expect(response.movies[0]?.posterPath).toBeNull();
    expect(catalogRepository.findByTmdbId).not.toHaveBeenCalled();
  });

  it("retorna posterPath null quando catálogo não encontra o filme", async () => {
    const catalogRepository = createCatalogRepositoryMock();
    vi.mocked(catalogRepository.findByTmdbId).mockResolvedValue(null);
    const mapper = new MovieRecommendationResponseMapper(catalogRepository);

    const response = await mapper.toResponse(
      [INTERNAL_MOVIE],
      "Recommendation without poster.",
    );

    expect(response.movies[0]?.posterPath).toBeNull();
  });

  it("não expõe campos internos fora do schema público", async () => {
    const movieWithInternalFields = {
      ...INTERNAL_MOVIE,
      catalogLookupIndex: 2,
      foundInCatalog: true,
    };
    const catalogRepository = createCatalogRepositoryMock();
    vi.mocked(catalogRepository.findByTmdbId).mockResolvedValue(null);
    const mapper = new MovieRecommendationResponseMapper(catalogRepository);

    const response = await mapper.toResponse(
      [movieWithInternalFields],
      "Mapped via public schema.",
    );

    expect(Object.keys(response.movies[0]!)).not.toContain("catalogLookupIndex");
    expect(Object.keys(response.movies[0]!)).not.toContain("foundInCatalog");
  });
});
