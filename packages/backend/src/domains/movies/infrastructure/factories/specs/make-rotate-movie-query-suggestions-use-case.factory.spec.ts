import { describe, it, expect, vi, beforeEach } from "vitest";
import { RotateMovieQuerySuggestionsUseCase } from "../../../application/use-cases/rotate-movie-query-suggestions.use-case";
import { AiMovieQuerySuggestionBatchProvider } from "../../providers/ai-movie-query-suggestion-batch.provider";
import { AiModels } from "@/lib/ai/ai-models";

const { envState, aiConstructorCalls } = vi.hoisted(() => ({
  envState: {
    OPENROUTER_API_KEY: "openrouter-key",
    GEMINI_API_KEY: "gemini-key",
  },
  aiConstructorCalls: [] as unknown[],
}));

vi.mock("@/env", () => ({
  env: {
    get OPENROUTER_API_KEY() {
      return envState.OPENROUTER_API_KEY;
    },
    get GEMINI_API_KEY() {
      return envState.GEMINI_API_KEY;
    },
  },
}));

vi.mock("@luanpoppe/ai", () => ({
  AI: class AI {
    constructor(config: unknown) {
      aiConstructorCalls.push(config);
    }
  },
}));

import { MakeRotateMovieQuerySuggestionsUseCaseFactory } from "../make-rotate-movie-query-suggestions-use-case.factory";

describe("MakeRotateMovieQuerySuggestionsUseCaseFactory", () => {
  beforeEach(() => {
    aiConstructorCalls.length = 0;
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "gemini-key";
  });

  it("cria um único AI e injeta AiMovieQuerySuggestionBatchProvider no use case", () => {
    const useCase = MakeRotateMovieQuerySuggestionsUseCaseFactory.create();
    const batchProvider = (
      useCase as unknown as {
        batchProvider: AiMovieQuerySuggestionBatchProvider;
      }
    ).batchProvider;

    expect(useCase).toBeInstanceOf(RotateMovieQuerySuggestionsUseCase);
    expect(batchProvider).toBeInstanceOf(AiMovieQuerySuggestionBatchProvider);
    expect(aiConstructorCalls).toHaveLength(1);
  });

  it("omite openRouterApiKey quando a chave está vazia", () => {
    envState.OPENROUTER_API_KEY = "";
    envState.GEMINI_API_KEY = "gemini-key";

    MakeRotateMovieQuerySuggestionsUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config).not.toHaveProperty("openRouterApiKey");
    expect(Object.keys(config).includes("openRouterApiKey")).toBe(false);
  });

  it("passa openRouterApiKey e Gemini quando as chaves estão presentes", () => {
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "gemini-key";

    MakeRotateMovieQuerySuggestionsUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config.openRouterApiKey).toBe("openrouter-key");
    expect(config.googleGeminiToken).toBe("gemini-key");
    expect(config.aiModelsFallback).toEqual([AiModels.GEMINI_FALLBACK]);
  });
});
