export class AiCallConstants {
  /**
   * Reasoning desligado nas chamadas de structured output. Modelos DeepSeek
   * podem emitir texto extra junto do JSON quando o reasoning está ativo.
   */
  static readonly STRUCTURED_OUTPUT_REASONING_EFFORT = "none" as const;
}
