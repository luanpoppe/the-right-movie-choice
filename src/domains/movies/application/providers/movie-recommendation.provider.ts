import { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import { MovieRecommendationEntity } from "../../domain/entities/movie-recommendation-llm-response.entity";

export interface IMovieRecommendationProvider {
  getStructuredMoviesRecommendation(
    userMessage: string,
    chatHistory: ChatHistoryEntity
  ): Promise<MovieRecommendationEntity>;

  getChatResponse(
    movies: MovieRecommendationEntity,
    userMessage: string,
    chatHistory: ChatHistoryEntity
  ): Promise<string>;
}
