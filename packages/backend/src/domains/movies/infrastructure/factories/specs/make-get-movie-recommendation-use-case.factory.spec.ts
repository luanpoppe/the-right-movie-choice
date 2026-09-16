import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { GetMovieRecommendationUseCase } from "../../../application/use-cases/get-movie-recommendation.use-case";
import { AiMovieRecommendationProvider } from "../../providers/ai-movie-recommendation.provider";
import { AiModels } from "@/lib/ai/ai-models";
import { PrismaUserMovieEntryRepository } from "../../repositories/user-movie-entry/prisma-user-movie-entry.repository";

const { envState, aiConstructorCalls, lookupAiToolConstructorCalls } =
  vi.hoisted(() => ({
    envState: {
      OPENROUTER_API_KEY: "openrouter-key",
      GEMINI_API_KEY: "gemini-key",
      REDIS_URL: "redis://localhost:6379",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
    },
    aiConstructorCalls: [] as unknown[],
    lookupAiToolConstructorCalls: [] as unknown[],
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
    get DATABASE_URL() {
      return envState.DATABASE_URL;
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

vi.mock("../../providers/movie-catalog-lookup.ai-tool", () => ({
  MovieCatalogLookupAiTool: class MovieCatalogLookupAiTool {
    constructor(_catalogLookup: unknown, options?: unknown) {
      lookupAiToolConstructorCalls.push(options);
    }

    createLookupMoviesTool() {
      return { name: "lookupMovies", description: "stub", execute: vi.fn() };
    }
  },
}));

import { MakeGetMovieRecommendationUseCaseFactory } from "../make-get-movie-recommendation-use-case.factory";

describe("MakeGetMovieRecommendationUseCaseFactory", () => {
  beforeEach(() => {
    aiConstructorCalls.length = 0;
    lookupAiToolConstructorCalls.length = 0;
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "gemini-key";
    envState.REDIS_URL = "redis://localhost:6379";
    envState.DATABASE_URL = "postgresql://user:pass@localhost:5432/app";
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

  it("REQ-2, REQ-3: guest sem userId mantém memory redis com TTL de 20 minutos", () => {
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
    expect(config.memory).not.toHaveProperty("connectionString");
  });

  it("REQ-1, REQ-3: userId válido usa memory postgres com DATABASE_URL sem TTL", () => {
    envState.DATABASE_URL =
      "postgresql://postgres:secret@db-host:5432/the_right_movie";

    MakeGetMovieRecommendationUseCaseFactory.create({ userId: 7 });

    const config = aiConstructorCalls[0] as {
      memory: {
        type: string;
        connectionString: string;
        options?: unknown;
        url?: unknown;
      };
    };

    expect(config.memory).toEqual({
      type: "postgres",
      connectionString: "postgresql://postgres:secret@db-host:5432/the_right_movie",
    });
    expect(config.memory).not.toHaveProperty("options");
    expect(config.memory).not.toHaveProperty("url");
    expect(Object.keys(config.memory)).toEqual(["type", "connectionString"]);
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
    expect(factorySource).toMatch(/CatalogPersistEnqueuer\.enqueue/);
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

  it("declara @langchain/langgraph-checkpoint-postgres no package.json do backend", () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies).toHaveProperty(
      "@langchain/langgraph-checkpoint-postgres",
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
    expect(factorySource).toMatch(/CatalogPersistEnqueuer\.enqueue/);
    expect(factorySource).toMatch(/new PrismaMovieCatalogRepository/);
    expect(factorySource).toMatch(/new TmdbMovieDetailsCache/);
    expect(factorySource).toMatch(/createLookupMoviesTool/);
    expect(factorySource).not.toMatch(/MakeMovieCatalogLookup/);
    expect(provider).toBeInstanceOf(AiMovieRecommendationProvider);
  });

  it("injeta CatalogPersistEnqueuer.enqueue no MovieCatalogDetailsResolver (factory e tmdb-debug)", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory.ts",
    );
    const tmdbDebugRoutesPath = path.join(
      process.cwd(),
      "src/modules/tmdb/infrastructure/http/controllers/tmdb-debug.routes.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");
    const tmdbDebugRoutesSource = readFileSync(tmdbDebugRoutesPath, "utf8");

    expect(factorySource).toMatch(/CatalogPersistEnqueuer\.enqueue/);
    expect(factorySource).toMatch(
      /new MovieCatalogDetailsResolver\([\s\S]*enqueuePersist/,
    );
    expect(tmdbDebugRoutesSource).toMatch(/CatalogPersistEnqueuer\.enqueue/);
    expect(tmdbDebugRoutesSource).toMatch(
      /new MovieCatalogDetailsResolver\([\s\S]*enqueuePersist/,
    );
  });

  it("instancia PrismaUserMovieEntryRepository no factory source", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");

    expect(factorySource).toMatch(/new PrismaUserMovieEntryRepository\(/);
  });

  it("passa opções de exclude ao MovieCatalogLookupAiTool quando excludeWatched true e userId válido", () => {
    const useCase = MakeGetMovieRecommendationUseCaseFactory.create({
      userId: 1,
      excludeWatched: true,
    });
    const useCaseRecord = useCase as unknown as {
      userMovieEntryRepository: PrismaUserMovieEntryRepository;
    };
    const lookupToolOptions = lookupAiToolConstructorCalls[0] as {
      userId: number;
      excludeWatched: boolean;
      userMovieEntryRepository: PrismaUserMovieEntryRepository;
    };

    expect(lookupToolOptions).toEqual({
      userId: 1,
      excludeWatched: true,
      userMovieEntryRepository: useCaseRecord.userMovieEntryRepository,
    });
    expect(useCaseRecord.userMovieEntryRepository).toBeInstanceOf(
      PrismaUserMovieEntryRepository,
    );
  });

  it("cria MovieCatalogLookupAiTool sem opções de exclude quando create é undefined", () => {
    MakeGetMovieRecommendationUseCaseFactory.create();

    expect(lookupAiToolConstructorCalls).toHaveLength(1);
    expect(lookupAiToolConstructorCalls[0]).toBeUndefined();
  });

  it("cria MovieCatalogLookupAiTool sem opções de exclude quando excludeWatched é false", () => {
    MakeGetMovieRecommendationUseCaseFactory.create({
      userId: 1,
      excludeWatched: false,
    });

    expect(lookupAiToolConstructorCalls).toHaveLength(1);
    expect(lookupAiToolConstructorCalls[0]).toBeUndefined();
  });

  it("REQ-10: wiring exclude compartilha o mesmo PrismaUserMovieEntryRepository entre use case e lookup tool", () => {
    const useCase = MakeGetMovieRecommendationUseCaseFactory.create({
      userId: 7,
      excludeWatched: true,
    });
    const useCaseRecord = useCase as unknown as {
      userMovieEntryRepository: PrismaUserMovieEntryRepository;
    };
    const lookupToolOptions = lookupAiToolConstructorCalls[0] as {
      userMovieEntryRepository: PrismaUserMovieEntryRepository;
    };

    expect(useCaseRecord.userMovieEntryRepository).toBe(
      lookupToolOptions.userMovieEntryRepository,
    );
  });

  it("injeta userMovieEntryRepository no GetMovieRecommendationUseCase", () => {
    const useCase = MakeGetMovieRecommendationUseCaseFactory.create();
    const useCaseRecord = useCase as unknown as {
      userMovieEntryRepository: PrismaUserMovieEntryRepository;
    };

    expect(useCaseRecord.userMovieEntryRepository).toBeInstanceOf(
      PrismaUserMovieEntryRepository,
    );
  });
});
