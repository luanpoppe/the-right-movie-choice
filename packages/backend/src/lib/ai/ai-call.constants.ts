import type { OpenRouterProviderPreferences } from "@luanpoppe/ai";

export class AiCallConstants {
  /**
   * Reasoning em low nas chamadas de structured output.
   */
  static readonly STRUCTURED_OUTPUT_REASONING_EFFORT = "low" as const;

  /**
   * Relace e um provider com zero data retention. `zdr: true` impede o
   * OpenRouter de rotear para um provider sem essa politica.
   */
  static readonly OPENROUTER_PROVIDER: OpenRouterProviderPreferences = {
    only: ["relace"],
    sort: "latency",
    zdr: true,
  };
}
