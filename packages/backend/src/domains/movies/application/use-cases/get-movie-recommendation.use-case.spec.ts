import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetMovieRecommendationUseCase } from "./get-movie-recommendation.use-case";
import { IMovieRecommendationProvider } from "../providers/movie-recommendation.provider";
import { MovieRecommendationEntity } from "../../domain/entities/movie-recommendation.entity";

describe("GetMovieRecommendationUseCase", () => {
  let movieRecommendationProvider: IMovieRecommendationProvider;
  let getMovieRecommendationUseCase: GetMovieRecommendationUseCase;

  beforeEach(() => {
    movieRecommendationProvider = {
      getStructuredMoviesRecommendation: vi.fn(),
      getChatResponse: vi.fn(),
    };

    getMovieRecommendationUseCase = new GetMovieRecommendationUseCase(
      movieRecommendationProvider
    );
  });

  it("devolve filmes e resposta do chat passando chatId ao provider", async () => {
    const userMessage = "I want to watch a sci-fi movie";
    const chatId = "test-chat-id";
    const mockStructuredMovies: MovieRecommendationEntity = {
      movies: [
        {
          title: "Inception",
          director: "Christopher Nolan",
          actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
          releaseYear: 2010,
          streamingPlatform: "Netflix",
          imdbRating: 8.8,
          synopsis:
            "A thief who steals corporate secrets through use of dream-sharing technology.",
          whySuggestion:
            "Watch it for the breathtaking action sequences and a high-concept story that will keep you guessing long after the credits roll.",

          durationInMinutes: 148,
        },
      ],
    };
    const mockChatResponse =
      "Here are some sci-fi movie recommendations for you!";

    vi.mocked(
      movieRecommendationProvider.getStructuredMoviesRecommendation
    ).mockResolvedValue(mockStructuredMovies);
    vi.mocked(movieRecommendationProvider.getChatResponse).mockResolvedValue(
      mockChatResponse
    );

    const result = await getMovieRecommendationUseCase.execute(
      userMessage,
      chatId
    );

    expect(
      movieRecommendationProvider.getStructuredMoviesRecommendation
    ).toHaveBeenCalledWith(userMessage, chatId);
    expect(movieRecommendationProvider.getChatResponse).toHaveBeenCalledWith(
      mockStructuredMovies,
      userMessage,
      chatId
    );
    expect(result).toEqual({
      movies: mockStructuredMovies.movies,
      response: mockChatResponse,
    });
  });
});
