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

    await this.saveChatHistory(userMessage, chatResponse, chatId);

    return {
      movies: structuredMovies.movies,
      response: chatResponse,
    };
  }

  private async saveChatHistory(
    userMessage: string,
    chatResponse: string,
    chatId: string
  ) {
    const tentyMinutesInSeconds = 60 * 20;
    await this.chatHistoryRepository.addMessage(
      [
        ["user", userMessage],
        ["ai", chatResponse],
      ],
      chatId,
      tentyMinutesInSeconds
    );
  }
}
