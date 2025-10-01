import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetMovieRecommendationUseCase } from "./get-movie-recommendation.use-case";
import { IChatHistoryRepository } from "@/core/repositories/chat-history.repository";
import { IMovieRecommendationProvider } from "../providers/movie-recommendation.provider";
import { MovieRecommendationEntity } from "../../domain/entities/movie-recommendation.entity";

describe("GetMovieRecommendationUseCase", () => {
  let chatHistoryRepository: IChatHistoryRepository;
  let movieRecommendationProvider: IMovieRecommendationProvider;
  let getMovieRecommendationUseCase: GetMovieRecommendationUseCase;

  beforeEach(() => {
    chatHistoryRepository = {
      getHistory: vi.fn(),
      addMessage: vi.fn(),
    };
    movieRecommendationProvider = {
      getStructuredMoviesRecommendation: vi.fn(),
      getChatResponse: vi.fn(),
    };

    getMovieRecommendationUseCase = new GetMovieRecommendationUseCase(
      chatHistoryRepository,
      movieRecommendationProvider
    );
  });

  it("should return movie recommendations and chat response", async () => {
    const userMessage = "I want to watch a sci-fi movie";
    const chatId = "test-chat-id";
    const mockChatHistory: Array<["user" | "ai", string]> = [
      ["user", "hello"],
      ["ai", "hi"],
    ];
    const mockStructuredMovies: MovieRecommendationEntity = {
      movies: [
        {
          title: "Inception",
          director: "Christopher Nolan",
          actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
          releaseYear: 2010,
          streamingPlatform: "Netflix",
          imdbRating: 8.8,
          description:
            "A thief who steals corporate secrets through use of dream-sharing technology.",
          durationInMinutes: 148,
        },
      ],
    };
    const mockChatResponse =
      "Here are some sci-fi movie recommendations for you!";

    vi.mocked(chatHistoryRepository.getHistory).mockResolvedValue(
      mockChatHistory
    );
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

    expect(chatHistoryRepository.getHistory).toHaveBeenCalledWith(chatId);
    expect(
      movieRecommendationProvider.getStructuredMoviesRecommendation
    ).toHaveBeenCalledWith(userMessage, mockChatHistory);
    expect(movieRecommendationProvider.getChatResponse).toHaveBeenCalledWith(
      mockStructuredMovies,
      userMessage,
      mockChatHistory
    );
    expect(chatHistoryRepository.addMessage).toHaveBeenCalledWith(
      [
        ["user", userMessage],
        ["ai", mockChatResponse],
      ],
      chatId,
      120
    );
    expect(result).toEqual({
      movies: mockStructuredMovies.movies,
      response: mockChatResponse,
    });
  });

  it("should handle empty chat history", async () => {
    const userMessage = "Recommend a comedy";
    const chatId = "new-chat-id";
    const mockStructuredMovies: MovieRecommendationEntity = {
      movies: [
        {
          title: "The Hangover",
          director: "Todd Phillips",
          actors: ["Bradley Cooper", "Ed Helms"],
          releaseYear: 2009,
          streamingPlatform: "Hulu",
          imdbRating: 7.7,
          description:
            "Three groomsmen lose their best man during a bachelor party in Las Vegas.",
          durationInMinutes: 100,
        },
      ],
    };
    const mockChatResponse = "Looking for a laugh? Try this one!";

    vi.mocked(chatHistoryRepository.getHistory).mockResolvedValue([]);
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

    expect(chatHistoryRepository.getHistory).toHaveBeenCalledWith(chatId);
    expect(
      movieRecommendationProvider.getStructuredMoviesRecommendation
    ).toHaveBeenCalledWith(userMessage, []);
    expect(movieRecommendationProvider.getChatResponse).toHaveBeenCalledWith(
      mockStructuredMovies,
      userMessage,
      []
    );
    expect(chatHistoryRepository.addMessage).toHaveBeenCalledWith(
      [
        ["user", userMessage],
        ["ai", mockChatResponse],
      ],
      chatId,
      120
    );
    expect(result).toEqual({
      movies: mockStructuredMovies.movies,
      response: mockChatResponse,
    });
  });
});
