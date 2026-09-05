import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { GetMovieRecommendationUseCase } from "../../../application/use-cases/get-movie-recommendation.use-case";
import { AiMovieRecommendationProvider } from "../../providers/ai-movie-recommendation.provider";
import { AiModels } from "@/lib/ai/ai-models";

const { envState, aiConstructorCalls } = vi.hoisted(() => ({
  envState: {
    OPENROUTER_API_KEY: "openrouter-key",
    GEMINI_API_KEY: "gemini-key",
    REDIS_URL: "redis://localhost:6379",
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
    get REDIS_URL() {
      return envState.REDIS_URL;
    },
  },
}));

vi.mock("@luanpoppe/ai", () => ({
  AI: class AI {
    constructor(config: unknown) {
      aiConstructorCalls.push(config);
    }
  },
  AITools: class AITools {
    createTool() {
      return { name: "lookupMovies", description: "stub", execute: vi.fn() };
    }
  },
}));

vi.mock(
  "@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory",
  () => ({
    MakeTmdbHttpClientFactory: {
      create: vi.fn(() => ({})),
    },
  }),
);

import { MakeGetMovieRecommendationUseCaseFactory } from "../make-get-movie-recommendation-use-case.factory";

describe("MakeGetMovieRecommendationUseCaseFactory", () => {
  beforeEach(() => {
    aiConstructorCalls.length = 0;
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "gemini-key";
    envState.REDIS_URL = "redis://localhost:6379";
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

  it("prefixa redis:// no memory.url quando REDIS_URL é host:porta (ioredis)", () => {
    envState.REDIS_URL = "localhost:6379";

    MakeGetMovieRecommendationUseCaseFactory.create();

    const config = aiConstructorCalls[0] as {
      memory: { url: string };
    };

    expect(config.memory.url).toBe("redis://localhost:6379");
  });

  it("passa memory redis no mesmo AI do provider com TTL de 20 minutos", () => {
    envState.REDIS_URL = "redis://memory-host:6380";

    MakeGetMovieRecommendationUseCaseFactory.create();

    const config = aiConstructorCalls[0] as {
      memory: {
        type: string;
        url: string;
        options: { defaultTTL: number; refreshOnRead: boolean };
      };
    };

    expect(config.memory).toEqual({
      type: "redis",
      url: "redis://memory-host:6380",
      options: {
        defaultTTL: 1200,
        refreshOnRead: true,
      },
    });
    expect(Object.keys(config.memory.options)).toEqual([
      "defaultTTL",
      "refreshOnRead",
    ]);
  });

  it("permite Redis para TmdbMovieDetailsCache e não injeta ChatHistoryAiMemoryRepository no use case", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");
    const useCase = MakeGetMovieRecommendationUseCaseFactory.create();
    const useCaseRecord = useCase as unknown as Record<string, unknown>;

    expect(factorySource).toMatch(/new Redis\(/);
    expect(factorySource).toMatch(/new TmdbMovieDetailsCache/);
    expect(factorySource).toMatch(/new PrismaMovieCatalogRepository/);
    expect(factorySource).toMatch(/new MovieCatalogDetailsResolver/);
    expect(factorySource).not.toMatch(/ChatHistoryRedisRepository/);
    expect(factorySource).not.toMatch(/ChatHistoryAiMemoryRepository/);
    expect(useCaseRecord.chatHistoryRepository).toBeUndefined();
  });

  it("declara @langchain/langgraph-checkpoint-redis no package.json do backend", () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies).toHaveProperty(
      "@langchain/langgraph-checkpoint-redis",
    );
  });

  it("não declara @langchain/core, @langchain/google-genai nem langchain no package.json", () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const declaredNames = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ];

    expect(declaredNames).not.toContain("@langchain/core");
    expect(declaredNames).not.toContain("@langchain/google-genai");
    expect(declaredNames).not.toContain("langchain");
  });

  it("remove lib/langchain e leftover LangChain, preservando lib/ai e lib/redis", () => {
    const langchainDir = path.join(process.cwd(), "src/lib/langchain");
    const aiDir = path.join(process.cwd(), "src/lib/ai");
    const redisDir = path.join(process.cwd(), "src/lib/redis");
    const leftoverRecommendationProvider = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/providers/langchain-movie-recommendation.provider.ts",
    );
    const leftoverQueryExamplesProvider = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/providers/langchain-movies-query-examples.provider.ts",
    );
    const leftoverChatHistoryUtils = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/providers/chat-history-ai-messages.utils.ts",
    );

    expect(existsSync(langchainDir)).toBe(false);
    expect(existsSync(leftoverRecommendationProvider)).toBe(false);
    expect(existsSync(leftoverQueryExamplesProvider)).toBe(false);
    expect(existsSync(leftoverChatHistoryUtils)).toBe(false);
    expect(existsSync(aiDir)).toBe(true);
    expect(existsSync(redisDir)).toBe(true);
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

  it("liga catálogo TMDB, lookup e tool ao AiMovieRecommendationProvider", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");
    const useCase = MakeGetMovieRecommendationUseCaseFactory.create();
    const provider = (
      useCase as unknown as {
        movieRecommendationProvider: AiMovieRecommendationProvider;
      }
    ).movieRecommendationProvider;

    expect(factorySource).toMatch(/MakeTmdbHttpClientFactory/);
    expect(factorySource).toMatch(/new MovieCatalogLookupService/);
    expect(factorySource).toMatch(/new MovieCatalogDetailsResolver/);
    expect(factorySource).toMatch(/new PrismaMovieCatalogRepository/);
    expect(factorySource).toMatch(/new TmdbMovieDetailsCache/);
    expect(factorySource).toMatch(/createLookupMoviesTool/);
    expect(factorySource).not.toMatch(/MakeMovieCatalogLookup/);
    expect(provider).toBeInstanceOf(AiMovieRecommendationProvider);
  });
});
