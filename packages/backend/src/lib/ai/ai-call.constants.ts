import type { OpenRouterProviderPreferences } from "@luanpoppe/ai";

type ZdrOpenRouterProvider = OpenRouterProviderPreferences & {
  zdr: boolean;
};

export class AiCallConstants {
  /**
   * Reasoning em low nas chamadas de structured output.
   */
  static readonly STRUCTURED_OUTPUT_REASONING_EFFORT = "low" as const;

  /**
   * Relace e um provider com zero data retention. `zdr: true` impede o
   * OpenRouter de rotear para um provider sem essa politica. O campo ainda
   * nao esta no tipo do `@luanpoppe/ai@1.2.1`, mas e repassado no request.
   */
  static readonly OPENROUTER_PROVIDER: ZdrOpenRouterProvider = {
    only: ["relace"],
    sort: "latency",
    zdr: true,
  };
}
