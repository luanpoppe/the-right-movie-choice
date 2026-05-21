import { Redis } from "@/lib/redis/redis";
import { ChatHistoryRedisRepository } from "@/infrastructure/repositories/chat-history-redis.repository";

import { Langchain } from "@/lib/langchain/langchain";
import { GetMovieRecommendationUseCase } from "../../application/use-cases/get-movie-recommendation.use-case";
import { LangchainMovieRecommendationProvider } from "../providers/langchain-movie-recommendation.provider";

export class MakeGetMovieRecommendationUseCaseFactory {
  static create() {
    const langchain = new Langchain();
    const model = langchain.model.gemini();

    const redis = new Redis();
    const chatHistoryRepository = new ChatHistoryRedisRepository(redis);
    const movieRecommendationProvider =
      new LangchainMovieRecommendationProvider(langchain, model);

    const useCase = new GetMovieRecommendationUseCase(
      chatHistoryRepository,
      movieRecommendationProvider
    );
    return useCase;
  }
}
