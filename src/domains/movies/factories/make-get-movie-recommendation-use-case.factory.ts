import { Redis } from "@/lib/redis/redis";
import { ChatHistoryRedisRepository } from "@/repositories/chat-history-redis.repository";
import { GetMovieRecommendationUseCase } from "../application/use-cases/get-movie-recommendation.use-case";
import { Langchain } from "@/lib/langchain/langchain";

export class MakeGetMovieRecommendationUseCaseFactory {
  static create() {
    const redis = new Redis();
    const chatHistoryRepository = new ChatHistoryRedisRepository(redis);

    const langchain = new Langchain();
    const model = langchain.model.gemini();

    const useCase = new GetMovieRecommendationUseCase(
      chatHistoryRepository,
      langchain,
      model
    );
    return useCase;
  }
}
