import { AI } from "@luanpoppe/ai";
import { env } from "@/env";
import { AiModels } from "@/lib/ai/ai-models";
import { StringUtils } from "@/shared/utils/string.utils";

import { GetMoviesQueryExamplesUseCase } from "../../application/use-cases/get-movies-query-examples.use-case";
import { AiMoviesQueryExamplesProvider } from "../providers/ai-movies-query-examples.provider";

type AiConstructorConfig = ConstructorParameters<typeof AI>[0];

export class MakeGetMoviesQueryExamplesUseCaseFactory {
  static create() {
    const config = MakeGetMoviesQueryExamplesUseCaseFactory.buildAiConfig();
    const ai = new AI(config);
    const movieQueryExamplesProvider = new AiMoviesQueryExamplesProvider(ai);

    const useCase = new GetMoviesQueryExamplesUseCase(
      movieQueryExamplesProvider,
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
