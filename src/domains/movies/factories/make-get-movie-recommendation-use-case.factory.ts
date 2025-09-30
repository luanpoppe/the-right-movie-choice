import { Redis } from "@/lib/redis/redis";
import { ChatHistoryRedisRepository } from "@/repositories/chat-history-redis.repository";
import { GetMovieRecommendationUseCase } from "../application/use-cases/get-movie-recommendation.use-case";

export class MakeGetMovieRecommendationUseCaseFactory {
  static create() {
    const redis = new Redis();
    const chatHistoryRepository = new ChatHistoryRedisRepository(redis);
    const useCase = new GetMovieRecommendationUseCase(chatHistoryRepository);
    return useCase;
  }
}
