import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MovieRecommendationPostgresMemory } from "@/lib/ai/movie-recommendation-postgres-memory";

const { aiConstructorCalls, recommendUseCaseCtorArgs } = vi.hoisted(() => ({
  aiConstructorCalls: [] as unknown[],
  recommendUseCaseCtorArgs: [] as unknown[][],
}));

vi.mock("@/env", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret-for-factory-spec",
    JWT_ACCESS_EXPIRES_IN: "15m",
    REDIS_URL: "redis://localhost:6379",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-4o-mini",
    OPENROUTER_API_KEY: "openrouter-key",
    GEMINI_API_KEY: "gemini-key",
  },
}));

vi.mock("@luanpoppe/ai", () => ({
  AI: class AI {
    constructor(config: unknown) {
      aiConstructorCalls.push(config);
    }
  },
  AIMemory: class AIMemory {
    constructor(public config: { type: string; connectionString?: string }) {}
  },
  AITools: class AITools {
    createTool() {
      return { name: "lookupMovies", description: "stub", execute: vi.fn() };
    }
  },
}));

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    userGroup: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    groupMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    groupChat: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    movieCatalog: {
      findUnique: vi.fn(),
    },
    userMovieEntry: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/redis/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    getString: vi.fn(),
    setString: vi.fn(),
  })),
}));

vi.mock("@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory", () => ({
  MakeTmdbHttpClientFactory: {
    create: vi.fn(() => ({})),
  },
}));

vi.mock(
  "@/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory",
  () => ({
    MakeGetMovieRecommendationUseCaseFactory: {
      create: vi.fn(() => ({ execute: vi.fn() })),
      createConversationTitleGenerator: vi.fn(() => ({
        generateFromUserMessage: vi.fn(),
      })),
    },
  }),
);

vi.mock(
  "@/modules/social/application/use-cases/recommend-in-group-chat.use-case",
  async (importOriginal) => {
    const module =
      await importOriginal<
        typeof import("@/modules/social/application/use-cases/recommend-in-group-chat.use-case")
      >();

    return {
      ...module,
      RecommendInGroupChatUseCase: class extends module.RecommendInGroupChatUseCase {
        constructor(
          ...args: ConstructorParameters<typeof module.RecommendInGroupChatUseCase>
        ) {
          recommendUseCaseCtorArgs.push(args);
          super(...args);
        }
      },
    };
  },
);

import { MakeGetMovieRecommendationUseCaseFactory } from "@/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory";
import { MakeGroupChatsHttpFactory } from "../make-group-chats-http.factory";

describe("MakeGroupChatsHttpFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiConstructorCalls.length = 0;
    recommendUseCaseCtorArgs.length = 0;
    MovieRecommendationPostgresMemory.resetForTests();
  });

  it("retorna preHandler e handlers prontos para registrar nas rotas", () => {
    const http = MakeGroupChatsHttpFactory.create();

    expect(typeof http.preHandler).toBe("function");
    expect(typeof http.handlers.createGroupChat).toBe("function");
    expect(typeof http.handlers.listGroupChats).toBe("function");
    expect(typeof http.handlers.getGroupChat).toBe("function");
    expect(typeof http.handlers.updateGroupChatTitle).toBe("function");
    expect(typeof http.handlers.deleteGroupChat).toBe("function");
    expect(typeof http.handlers.updateGroupChatFilterMembers).toBe("function");
    expect(typeof http.handlers.recommendInGroupChat).toBe("function");
  });

  it("compõe preHandler async e handlers callable", async () => {
    const http = MakeGroupChatsHttpFactory.create();

    await expect(http.preHandler({ headers: {} } as never)).rejects.toThrow();
    expect(http.handlers.listGroupChats).toBeTypeOf("function");
    expect(http.handlers.recommendInGroupChat).toBeTypeOf("function");
  });

  it("factory declara dependências esperadas no código-fonte", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/modules/social/infrastructure/factories/make-group-chats-http.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");

    expect(factorySource).toMatch(/new JoseAccessTokenProvider\(\)/);
    expect(factorySource).toMatch(/new PrismaUserGroupRepository\(\)/);
    expect(factorySource).toMatch(/new PrismaGroupChatRepository\(\)/);
    expect(factorySource).toMatch(/new PrismaMovieCatalogRepository\(\)/);
    expect(factorySource).toMatch(/new PostgresChatThreadRepository\(\)/);
    expect(factorySource).toMatch(/new ChatHistoryAiMemoryRepository\(/);
    expect(factorySource).toMatch(/new CreateGroupChatUseCase\(/);
    expect(factorySource).toMatch(/new GetGroupChatUseCase\(/);
    expect(factorySource).toMatch(/new DeleteGroupChatUseCase\(/);
    expect(factorySource).toMatch(/new RecommendInGroupChatUseCase\(/);
    expect(factorySource).toMatch(
      /MakeGetMovieRecommendationUseCaseFactory\.create,/,
    );
    expect(factorySource).toMatch(
      /MakeGetMovieRecommendationUseCaseFactory\.createConversationTitleGenerator\(\)/,
    );
    expect(factorySource).toMatch(/UserMovieEntryAuthHook\.createPreHandler/);
    expect(factorySource).toMatch(/GroupChatsController\.create\(/);
  });

  it("REQ-5/C10: wiring de recommendation usa memory postgres compartilhado e factory per-request", () => {
    MakeGroupChatsHttpFactory.create();

    const sharedPostgresMemory = MovieRecommendationPostgresMemory.getShared();
    const postgresAiConfigs = aiConstructorCalls.filter((config) => {
      const memory = (config as { memory?: unknown }).memory;
      return memory === sharedPostgresMemory;
    });
    const wiredAiConfig = postgresAiConfigs[0] as {
      memory: {
        config: { type: string; connectionString: string };
      };
    };
    const wiredCreateGetMovieRecommendationUseCase =
      recommendUseCaseCtorArgs[0]?.[2];

    expect(postgresAiConfigs.length).toBeGreaterThan(0);
    expect(wiredAiConfig.memory.config).toEqual({
      type: "postgres",
      connectionString: "postgresql://user:pass@localhost:5432/app",
    });
    expect(recommendUseCaseCtorArgs).toHaveLength(1);
    expect(wiredCreateGetMovieRecommendationUseCase).toBe(
      MakeGetMovieRecommendationUseCaseFactory.create,
    );
    expect(
      MakeGetMovieRecommendationUseCaseFactory.create,
    ).not.toHaveBeenCalled();
    expect(
      MakeGetMovieRecommendationUseCaseFactory.createConversationTitleGenerator,
    ).toHaveBeenCalledTimes(1);
  });
});
