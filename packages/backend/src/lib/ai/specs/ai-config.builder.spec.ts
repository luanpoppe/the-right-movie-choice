import { describe, it, expect } from "vitest";
import { AiModels } from "../ai-models";
import { AiConfigBuilder } from "../ai-config.builder";

describe("AiConfigBuilder", () => {
  it("omite openRouterApiKey quando a chave está vazia", () => {
    const config = AiConfigBuilder.buildFromKeys({
      openRouterApiKey: "",
      geminiApiKey: "gemini-key",
    });

    expect(config).not.toHaveProperty("openRouterApiKey");
    expect(Object.keys(config).includes("openRouterApiKey")).toBe(false);
  });

  it("passa openRouterApiKey quando a chave não é vazia", () => {
    const config = AiConfigBuilder.buildFromKeys({
      openRouterApiKey: "openrouter-key",
      geminiApiKey: "gemini-key",
    });

    expect(config.openRouterApiKey).toBe("openrouter-key");
    expect(config.googleGeminiToken).toBe("gemini-key");
    expect(config.aiModelsFallback).toEqual([AiModels.GEMINI_FALLBACK]);
  });

  it("omite googleGeminiToken e fallback quando GEMINI_API_KEY é vazia", () => {
    const config = AiConfigBuilder.buildFromKeys({
      openRouterApiKey: "openrouter-key",
      geminiApiKey: "",
    });

    expect(config).not.toHaveProperty("googleGeminiToken");
    expect(config).not.toHaveProperty("aiModelsFallback");
  });

  it("mantém googleGeminiToken quando GEMINI_API_KEY tem apenas espaços", () => {
    const config = AiConfigBuilder.buildFromKeys({
      openRouterApiKey: "openrouter-key",
      geminiApiKey: "  ",
    });

    expect(config.googleGeminiToken).toBe("  ");
    expect(config.aiModelsFallback).toEqual([AiModels.GEMINI_FALLBACK]);
  });
});
