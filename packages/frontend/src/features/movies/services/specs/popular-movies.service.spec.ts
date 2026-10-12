import { movieClient } from "@/lib/api/movie-client";
import { PopularMoviesService } from "../popular-movies.service";

jest.mock("@/lib/api/movie-client", () => ({
  movieClient: {
    get: jest.fn(),
  },
}));

const mockedGet = jest.mocked(movieClient.get);

class PopularMoviesFixtures {
  static movie(overrides: Record<string, unknown> = {}) {
    return {
      tmdbId: 27205,
      title: "Inception",
      year: 2010,
      posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
      overview: "A thief who steals corporate secrets through dream-sharing.",
      runtimeMinutes: 148,
      voteAverage: 8.8,
      directors: ["Christopher Nolan"],
      ...overrides,
    };
  }
}

describe("PopularMoviesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue({
      data: { movies: [PopularMoviesFixtures.movie()] },
    });
  });

  it("chama GET /movie/popular e devolve os filmes", async () => {
    const result = await PopularMoviesService.getPopularMovies();

    expect(mockedGet).toHaveBeenCalledWith("/movie/popular");
    expect(result.movies[0]?.title).toBe("Inception");
  });

  it("valida o payload com zod", async () => {
    mockedGet.mockResolvedValue({
      data: { movies: [PopularMoviesFixtures.movie({ voteAverage: "oito" })] },
    });

    await expect(PopularMoviesService.getPopularMovies()).rejects.toThrow();
  });
});
