import { SingleMovieReccomendationSchema } from "../../entities/movie-recommendation.entity";
import {
  MovieRecommendationRequestDTOSchema,
  MovieRecommendationResponseDTOSchema,
} from "../movie-recommendation.dto";

class MovieRecommendationDtoFixtures {
  static recommendationRequest(overrides?: { excludeWatched?: boolean }) {
    return {
      userMessage: "filme de sci-fi",
      ...overrides,
    };
  }

  static publicMovie() {
    return {
      title: "Fight Club",
      director: "David Fincher",
      actors: ["Brad Pitt", "Edward Norton"],
      releaseYear: 1999,
      streamingPlatform: "Prime Video",
      imdbRating: 8.8,
      synopsis: "An insomniac office worker forms an underground fight club.",
      whySuggestion: "Dark psychological thriller that matches the mood.",
      durationInMinutes: 139,
    };
  }
}

describe("MovieRecommendationRequestDTO", () => {
  it("REQ-8: aceita userMessage sem excludeWatched", () => {
    const request = MovieRecommendationDtoFixtures.recommendationRequest();

    const parsed = MovieRecommendationRequestDTOSchema.parse(request);

    expect(parsed).toEqual({ userMessage: "filme de sci-fi" });
  });

  it("REQ-8: aceita excludeWatched boolean opcional", () => {
    const requestWithExclusion =
      MovieRecommendationDtoFixtures.recommendationRequest({
        excludeWatched: true,
      });

    const parsed =
      MovieRecommendationRequestDTOSchema.parse(requestWithExclusion);

    expect(parsed).toEqual({
      userMessage: "filme de sci-fi",
      excludeWatched: true,
    });
  });

  it("REQ-8: aceita excludeWatched false", () => {
    const requestWithoutExclusion =
      MovieRecommendationDtoFixtures.recommendationRequest({
        excludeWatched: false,
      });

    const parsed = MovieRecommendationRequestDTOSchema.parse(
      requestWithoutExclusion,
    );

    expect(parsed).toEqual({
      userMessage: "filme de sci-fi",
      excludeWatched: false,
    });
  });

  it("REQ-8: rejeita userMessage vazio", () => {
    const requestWithEmptyMessage = { userMessage: "" };

    const parseResult = MovieRecommendationRequestDTOSchema.safeParse(
      requestWithEmptyMessage,
    );

    expect(parseResult.success).toBe(false);
  });
});

describe("MovieRecommendationResponseDTO", () => {
  it("usa SingleMovieReccomendationSchema nos filmes da resposta", () => {
    const moviesElement =
      MovieRecommendationResponseDTOSchema.shape.movies.element;

    expect(moviesElement).toBe(SingleMovieReccomendationSchema);
  });

  it("REQ-6: aceita JSON de recommendation com tmdbId e imdbId", () => {
    const publicMovie = MovieRecommendationDtoFixtures.publicMovie();
    const movieWithCatalogIds = {
      ...publicMovie,
      tmdbId: 550,
      imdbId: "tt0137523",
    };

    const parsed = MovieRecommendationResponseDTOSchema.parse({
      movies: [movieWithCatalogIds],
      response: "Sugestão com ids do catálogo.",
    });

    expect(parsed.movies[0]).toEqual(movieWithCatalogIds);
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
