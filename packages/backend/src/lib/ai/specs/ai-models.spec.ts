import { describe, expect, it } from "vitest";
import { AiModels } from "../ai-models";

describe("AiModels", () => {
  it("defines the OpenRouter primary model as a constant, not an env var", () => {
    expect(AiModels.PRIMARY).toBe("openrouter/deepseek/deepseek-v4-flash");
  });

  it("defines the Gemini fallback model as a constant", () => {
    expect(AiModels.GEMINI_FALLBACK).toBe("gemini-2.5-flash");
  });
});
