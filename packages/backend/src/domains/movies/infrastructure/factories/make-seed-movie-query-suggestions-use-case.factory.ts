import { AI } from "@luanpoppe/ai";
import { env } from "@/env";
import { AiModels } from "@/lib/ai/ai-models";
import { StringUtils } from "@/shared/utils/string.utils";

import { SeedMovieQuerySuggestionsUseCase } from "../../application/use-cases/seed-movie-query-suggestions.use-case";
import { AiMovieQuerySuggestionBatchProvider } from "../providers/ai-movie-query-suggestion-batch.provider";
import { PrismaMovieQuerySuggestionRepository } from "../repositories/movie-query-suggestion/prisma-movie-query-suggestion.repository";

type AiConstructorConfig = ConstructorParameters<typeof AI>[0];

export class MakeSeedMovieQuerySuggestionsUseCaseFactory {
  static create() {
    const config = MakeSeedMovieQuerySuggestionsUseCaseFactory.buildAiConfig();
    const ai = new AI(config);
    const batchProvider = new AiMovieQuerySuggestionBatchProvider(ai);
    const movieQuerySuggestionRepository =
      new PrismaMovieQuerySuggestionRepository();

    const useCase = new SeedMovieQuerySuggestionsUseCase(
      movieQuerySuggestionRepository,
      batchProvider,
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
