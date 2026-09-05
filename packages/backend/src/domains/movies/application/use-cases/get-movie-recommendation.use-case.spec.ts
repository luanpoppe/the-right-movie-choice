import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
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
    expect(
      movieRecommendationProvider.getStructuredMoviesRecommendation,
    ).toHaveBeenCalledTimes(1);
    expect(movieRecommendationProvider.getChatResponse).toHaveBeenCalledTimes(1);
  });

  it("não chama getChatResponse quando a recomendação estruturada falha", async () => {
    const failure = new Error("structured failed");
    vi.mocked(
      movieRecommendationProvider.getStructuredMoviesRecommendation,
    ).mockRejectedValue(failure);

    await expect(
      getMovieRecommendationUseCase.execute("msg", "chat-id"),
    ).rejects.toThrow("structured failed");

    expect(movieRecommendationProvider.getChatResponse).not.toHaveBeenCalled();
  });

  it("não importa IChatHistoryRepository nem chama getHistory", async () => {
    const useCasePath = path.join(
      process.cwd(),
      "src/domains/movies/application/use-cases/get-movie-recommendation.use-case.ts",
    );
    const useCaseSource = readFileSync(useCasePath, "utf8");
    const useCaseRecord = getMovieRecommendationUseCase as unknown as Record<
      string,
      unknown
    >;

    expect(useCaseSource).not.toMatch(/IChatHistoryRepository/);
    expect(useCaseSource).not.toMatch(/getHistory/);
    expect(useCaseRecord.chatHistoryRepository).toBeUndefined();
  });
});
