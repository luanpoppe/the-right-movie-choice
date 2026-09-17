import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

vi.mock("@/env", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret-for-factory-spec",
    JWT_ACCESS_EXPIRES_IN: "15m",
  },
}));

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    friendRequest: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { MakeFriendshipHttpFactory } from "../make-friendship-http.factory";

describe("MakeFriendshipHttpFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna preHandler e handlers prontos para registrar nas rotas", () => {
    const http = MakeFriendshipHttpFactory.create();

    expect(typeof http.preHandler).toBe("function");
    expect(typeof http.handlers.sendFriendRequest).toBe("function");
    expect(typeof http.handlers.acceptFriendRequest).toBe("function");
    expect(typeof http.handlers.rejectFriendRequest).toBe("function");
    expect(typeof http.handlers.cancelFriendRequest).toBe("function");
    expect(typeof http.handlers.removeFriend).toBe("function");
    expect(typeof http.handlers.listFriends).toBe("function");
    expect(typeof http.handlers.listIncomingFriendRequests).toBe("function");
    expect(typeof http.handlers.listOutgoingFriendRequests).toBe("function");
    expect(typeof http.handlers.searchUserByEmail).toBe("function");
  });

  it("compõe preHandler async e handlers callable", async () => {
    const http = MakeFriendshipHttpFactory.create();

    await expect(http.preHandler({ headers: {} } as never)).rejects.toThrow();
    expect(http.handlers.listFriends).toBeTypeOf("function");
    expect(http.handlers.searchUserByEmail).toBeTypeOf("function");
  });

  it("factory declara dependências esperadas no código-fonte", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/modules/social/infrastructure/factories/make-friendship-http.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");

    expect(factorySource).toMatch(/new JoseAccessTokenProvider\(\)/);
    expect(factorySource).toMatch(/new PrismaFriendRequestRepository\(\)/);
    expect(factorySource).toMatch(/new PrismaUserRepository\(\)/);
    expect(factorySource).toMatch(/new SendFriendRequestUseCase\(/);
    expect(factorySource).toMatch(/new AcceptFriendRequestUseCase\(/);
    expect(factorySource).toMatch(/new SearchUserByEmailUseCase\(/);
    expect(factorySource).toMatch(/UserMovieEntryAuthHook\.createPreHandler/);
    expect(factorySource).toMatch(/FriendshipController\.create\(/);
  });

  it("create() produz instâncias reais dos handlers", () => {
    const http = MakeFriendshipHttpFactory.create();

    expect(http.handlers.sendFriendRequest).toBeTypeOf("function");
    expect(http.handlers.listFriends).toBeTypeOf("function");
    expect(http.preHandler).toBeTypeOf("function");
  });
});
