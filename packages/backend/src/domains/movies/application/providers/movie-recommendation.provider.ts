import { MovieRecommendationEntity } from "../../domain/entities/movie-recommendation.entity";

export interface IMovieRecommendationProvider {
  getMovieRecommendation(
    userMessage: string,
    chatId: string,
  ): Promise<MovieRecommendationEntity>;
}
