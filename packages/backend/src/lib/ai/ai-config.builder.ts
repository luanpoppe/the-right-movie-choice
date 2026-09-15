import { AI } from "@luanpoppe/ai";
import { env } from "@/env";
import { StringUtils } from "@/shared/utils/string.utils";

import { AiModels } from "./ai-models";

type AiConstructorConfig = ConstructorParameters<typeof AI>[0];

export type AiEnvKeys = {
  openRouterApiKey?: string | undefined;
  geminiApiKey?: string | undefined;
};

export class AiConfigBuilder {
  static buildFromEnv(): AiConstructorConfig {
    const openRouterApiKey = env.OPENROUTER_API_KEY;
    const geminiApiKey = env.GEMINI_API_KEY;

    return AiConfigBuilder.buildFromKeys({
      openRouterApiKey,
      geminiApiKey,
    });
  }

  static buildFromKeys(keys: AiEnvKeys): AiConstructorConfig {
    const openRouterApiKey = keys.openRouterApiKey;
    const geminiApiKey = keys.geminiApiKey;
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
