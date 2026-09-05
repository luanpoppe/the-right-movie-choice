import { IChatHistoryRepository } from "@/core/repositories/chat-history.repository";
import { IMovieRecommendationProvider } from "../providers/movie-recommendation.provider";

export class GetMovieRecommendationUseCase {
  constructor(
    private chatHistoryRepository: IChatHistoryRepository,
    private movieRecommendationProvider: IMovieRecommendationProvider
  ) {}

  async execute(userMessage: string, chatId: string) {
    const chatHistory = await this.chatHistoryRepository.getHistory(chatId);

    const structuredMovies =
      await this.movieRecommendationProvider.getStructuredMoviesRecommendation(
        userMessage,
        chatHistory
      );

    const chatResponse = await this.movieRecommendationProvider.getChatResponse(
      structuredMovies,
      userMessage,
      chatHistory
    );

    return {
      movies: structuredMovies.movies,
      response: chatResponse,
    };
  }
}
