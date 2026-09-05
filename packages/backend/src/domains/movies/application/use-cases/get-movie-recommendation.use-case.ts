import { IMovieRecommendationProvider } from "../providers/movie-recommendation.provider";

export class GetMovieRecommendationUseCase {
  constructor(private movieRecommendationProvider: IMovieRecommendationProvider) {}

  async execute(userMessage: string, chatId: string) {
    const structuredMovies =
      await this.movieRecommendationProvider.getStructuredMoviesRecommendation(
        userMessage,
        chatId
      );

    const chatResponse = await this.movieRecommendationProvider.getChatResponse(
      structuredMovies,
      userMessage,
      chatId
    );

    return {
      movies: structuredMovies.movies,
      response: chatResponse,
    };
  }
}
