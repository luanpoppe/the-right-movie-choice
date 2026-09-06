import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SingleMovieReccomendationSchema } from "../../entities/movie-recommendation.entity";
import { MovieRecommendationResponseDTOSchema } from "../movie-recommendation.dto";

class MovieRecommendationDtoFixtures {
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

class MovieRecommendationDtoSource {
  static read() {
    const dtoPath = join(
      process.cwd(),
      "src/features/movies/dto/movie-recommendation.dto.ts",
    );
    return readFileSync(dtoPath, "utf8");
  }
}

describe("MovieRecommendationResponseDTO", () => {
  it("usa SingleMovieReccomendationSchema nos filmes da resposta", () => {
    const source = MovieRecommendationDtoSource.read();

    expect(source).toContain("SingleMovieReccomendationSchema");
    expect(MovieRecommendationResponseDTOSchema.shape.movies.element).toBe(
      SingleMovieReccomendationSchema,
    );
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
