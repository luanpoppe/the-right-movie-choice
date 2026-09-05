import { AI } from "@luanpoppe/ai";
import { env } from "@/env";
import { AiModels } from "@/lib/ai/ai-models";
import { StringUtils } from "@/shared/utils/string.utils";

import { GetMovieRecommendationUseCase } from "../../application/use-cases/get-movie-recommendation.use-case";
import { AiMovieRecommendationProvider } from "../providers/ai-movie-recommendation.provider";

type AiConstructorConfig = ConstructorParameters<typeof AI>[0];

const CHAT_MEMORY_TTL_SECONDS = 1200;

export class MakeGetMovieRecommendationUseCaseFactory {
  static create() {
    const config = MakeGetMovieRecommendationUseCaseFactory.buildAiConfig();
    const ai = new AI(config);

    const movieRecommendationProvider = new AiMovieRecommendationProvider(ai);

    const useCase = new GetMovieRecommendationUseCase(
      movieRecommendationProvider,
    );
    return useCase;
  }

  private static buildAiConfig(): AiConstructorConfig {
    const openRouterApiKey = env.OPENROUTER_API_KEY;
    const geminiApiKey = env.GEMINI_API_KEY;
    const redisUrl = env.REDIS_URL;
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
      memory: {
        type: "redis",
        url: redisUrl,
        options: {
          defaultTTL: CHAT_MEMORY_TTL_SECONDS,
          refreshOnRead: true,
        },
      },
    };
  }
}
