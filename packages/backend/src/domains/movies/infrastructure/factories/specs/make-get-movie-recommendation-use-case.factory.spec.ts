import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GetMovieRecommendationUseCase } from "../../../application/use-cases/get-movie-recommendation.use-case";
import { AiMovieRecommendationProvider } from "../../providers/ai-movie-recommendation.provider";
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

vi.mock("@/lib/redis/redis", () => ({
  Redis: class Redis {},
}));

vi.mock("@/infrastructure/repositories/chat-history-redis.repository", () => ({
  ChatHistoryRedisRepository: class ChatHistoryRedisRepository {},
}));

import { MakeGetMovieRecommendationUseCaseFactory } from "../make-get-movie-recommendation-use-case.factory";

describe("MakeGetMovieRecommendationUseCaseFactory", () => {
  beforeEach(() => {
    aiConstructorCalls.length = 0;
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "gemini-key";
  });

  it("cria um único AI e injeta AiMovieRecommendationProvider no use case", () => {
    const useCase = MakeGetMovieRecommendationUseCaseFactory.create();
    const provider = (
      useCase as unknown as {
        movieRecommendationProvider: AiMovieRecommendationProvider;
      }
    ).movieRecommendationProvider;

    expect(useCase).toBeInstanceOf(GetMovieRecommendationUseCase);
    expect(provider).toBeInstanceOf(AiMovieRecommendationProvider);
    expect(aiConstructorCalls).toHaveLength(1);
  });

  it("omite openRouterApiKey quando a chave está vazia", () => {
    envState.OPENROUTER_API_KEY = "";
    envState.GEMINI_API_KEY = "gemini-key";

    MakeGetMovieRecommendationUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config).not.toHaveProperty("openRouterApiKey");
    expect(Object.keys(config).includes("openRouterApiKey")).toBe(false);
  });

  it("passa openRouterApiKey quando a chave não é vazia", () => {
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "";

    MakeGetMovieRecommendationUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config.openRouterApiKey).toBe("openrouter-key");
  });

  it("inclui Gemini e fallback só quando GEMINI_API_KEY não é vazia", () => {
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "gemini-key";

    MakeGetMovieRecommendationUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config.googleGeminiToken).toBe("gemini-key");
    expect(config.aiModelsFallback).toEqual([AiModels.GEMINI_FALLBACK]);
  });

  it("omite googleGeminiToken e fallback quando GEMINI_API_KEY é vazia", () => {
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "";

    MakeGetMovieRecommendationUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config).not.toHaveProperty("googleGeminiToken");
    expect(config).not.toHaveProperty("aiModelsFallback");
  });

  it("trata espaços como chave Gemini presente porque isEmptyString não faz trim", () => {
    envState.OPENROUTER_API_KEY = "";
    envState.GEMINI_API_KEY = "  ";

    MakeGetMovieRecommendationUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config.googleGeminiToken).toBe("  ");
    expect(config.aiModelsFallback).toEqual([AiModels.GEMINI_FALLBACK]);
  });

  it("não referencia Langchain nem BaseChatModel no factory", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");

    expect(factorySource).not.toMatch(/Langchain/);
    expect(factorySource).not.toMatch(/BaseChatModel/);
  });
});
