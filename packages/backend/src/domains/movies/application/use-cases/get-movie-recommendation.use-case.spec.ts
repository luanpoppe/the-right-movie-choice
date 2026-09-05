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
      getMovieRecommendation: vi.fn(),
    };

    getMovieRecommendationUseCase = new GetMovieRecommendationUseCase(
      movieRecommendationProvider
    );
  });

  it("devolve filmes e resposta de uma única chamada ao provider com chatId", async () => {
    const userMessage = "I want to watch a sci-fi movie";
    const chatId = "test-chat-id";
    const mockRecommendation: MovieRecommendationEntity = {
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
      response: "Here are some sci-fi movie recommendations for you!",
    };

    vi.mocked(
      movieRecommendationProvider.getMovieRecommendation
    ).mockResolvedValue(mockRecommendation);

    const result = await getMovieRecommendationUseCase.execute(
      userMessage,
      chatId
    );

    expect(
      movieRecommendationProvider.getMovieRecommendation
    ).toHaveBeenCalledWith(userMessage, chatId);
    expect(
      movieRecommendationProvider.getMovieRecommendation,
    ).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      movies: mockRecommendation.movies,
      response: mockRecommendation.response,
    });
  });

  it("propaga o erro quando getMovieRecommendation falha", async () => {
    const failure = new Error("recommendation failed");
    vi.mocked(
      movieRecommendationProvider.getMovieRecommendation,
    ).mockRejectedValue(failure);

    await expect(
      getMovieRecommendationUseCase.execute("msg", "chat-id"),
    ).rejects.toThrow("recommendation failed");
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
