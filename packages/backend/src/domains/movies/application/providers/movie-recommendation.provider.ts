import { MovieRecommendationEntity } from "../../domain/entities/movie-recommendation.entity";

export interface IMovieRecommendationProvider {
  getStructuredMoviesRecommendation(
    userMessage: string,
    chatId: string
  ): Promise<MovieRecommendationEntity>;

  getChatResponse(
    movies: MovieRecommendationEntity,
    userMessage: string,
    chatId: string
  ): Promise<string>;
}
