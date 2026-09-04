import { AI } from "@luanpoppe/ai";
import { env } from "@/env";
import { Redis } from "@/lib/redis/redis";
import { AiModels } from "@/lib/ai/ai-models";
import { StringUtils } from "@/shared/utils/string.utils";
import { ChatHistoryRedisRepository } from "@/infrastructure/repositories/chat-history-redis.repository";

import { GetMovieRecommendationUseCase } from "../../application/use-cases/get-movie-recommendation.use-case";
import { AiMovieRecommendationProvider } from "../providers/ai-movie-recommendation.provider";

type AiConstructorConfig = ConstructorParameters<typeof AI>[0];

export class MakeGetMovieRecommendationUseCaseFactory {
  static create() {
    const config = MakeGetMovieRecommendationUseCaseFactory.buildAiConfig();
    const ai = new AI(config);

    const redis = new Redis();
    const chatHistoryRepository = new ChatHistoryRedisRepository(redis);
    const movieRecommendationProvider = new AiMovieRecommendationProvider(ai);

    const useCase = new GetMovieRecommendationUseCase(
      chatHistoryRepository,
      movieRecommendationProvider,
    );
    return useCase;
  }

  private static buildAiConfig(): AiConstructorConfig {
    const openRouterApiKey = env.OPENROUTER_API_KEY;
    const geminiApiKey = env.GEMINI_API_KEY;
    const hasOpenRouterApiKey = !StringUtils.isEmptyString(openRouterApiKey);
    const hasGeminiApiKey = !StringUtils.isEmptyString(geminiApiKey);

    return {
      ...(hasOpenRouterApiKey ? { openRouterApiKey } : {}),
      ...(hasGeminiApiKey
        ? {
            googleGeminiToken: geminiApiKey,
            aiModelsFallback: [AiModels.GEMINI_FALLBACK],
          }
        : {}),
    };
  }
}
