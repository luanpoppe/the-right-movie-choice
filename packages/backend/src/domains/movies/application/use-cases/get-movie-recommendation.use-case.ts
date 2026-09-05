import { IMovieRecommendationProvider } from "../providers/movie-recommendation.provider";

export class GetMovieRecommendationUseCase {
  constructor(private movieRecommendationProvider: IMovieRecommendationProvider) {}

  async execute(userMessage: string, chatId: string) {
    const recommendation =
      await this.movieRecommendationProvider.getMovieRecommendation(
        userMessage,
        chatId,
      );

    return {
      movies: recommendation.movies,
      response: recommendation.response,
    };
  }
}
