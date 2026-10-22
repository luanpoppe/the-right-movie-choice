export class AiCallConstants {
  /**
   * Reasoning em low nas chamadas de structured output. O provider DeepInfra
   * com `sort: "latency"` evita o endpoint `flex`, que e mais barato porem
   * lento demais para o fluxo agentico com tools.
   */
  static readonly STRUCTURED_OUTPUT_REASONING_EFFORT = "low" as const;
  static readonly OPENROUTER_PROVIDER_ONLY = ["deepinfra"];
  static readonly OPENROUTER_PROVIDER_SORT = "latency" as const;
}
