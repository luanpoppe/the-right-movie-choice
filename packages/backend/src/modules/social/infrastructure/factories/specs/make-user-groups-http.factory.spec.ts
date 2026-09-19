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
    groupInvite: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    friendRequest: {
      findMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { MakeUserGroupsHttpFactory } from "../make-user-groups-http.factory";

describe("MakeUserGroupsHttpFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna preHandler e handlers prontos para registrar nas rotas", () => {
    const http = MakeUserGroupsHttpFactory.create();

    expect(typeof http.preHandler).toBe("function");
    expect(typeof http.handlers.createUserGroup).toBe("function");
    expect(typeof http.handlers.listUserGroups).toBe("function");
    expect(typeof http.handlers.updateUserGroup).toBe("function");
    expect(typeof http.handlers.deleteUserGroup).toBe("function");
    expect(typeof http.handlers.sendGroupInvite).toBe("function");
    expect(typeof http.handlers.leaveUserGroup).toBe("function");
    expect(typeof http.handlers.removeGroupMember).toBe("function");
    expect(typeof http.handlers.listGroupMembers).toBe("function");
    expect(typeof http.handlers.suggestGroupFriends).toBe("function");
    expect(typeof http.handlers.acceptGroupInvite).toBe("function");
    expect(typeof http.handlers.rejectGroupInvite).toBe("function");
    expect(typeof http.handlers.cancelGroupInvite).toBe("function");
    expect(typeof http.handlers.listIncomingGroupInvites).toBe("function");
  });

  it("compõe preHandler async e handlers callable", async () => {
    const http = MakeUserGroupsHttpFactory.create();

    await expect(http.preHandler({ headers: {} } as never)).rejects.toThrow();
    expect(http.handlers.listUserGroups).toBeTypeOf("function");
    expect(http.handlers.suggestGroupFriends).toBeTypeOf("function");
  });

  it("factory declara dependências esperadas no código-fonte", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/modules/social/infrastructure/factories/make-user-groups-http.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");

    expect(factorySource).toMatch(/new JoseAccessTokenProvider\(\)/);
    expect(factorySource).toMatch(/new PrismaUserGroupRepository\(\)/);
    expect(factorySource).toMatch(/new PrismaGroupInviteRepository\(\)/);
    expect(factorySource).toMatch(/new PrismaFriendRequestRepository\(\)/);
    expect(factorySource).toMatch(/new PrismaUserRepository\(\)/);
    expect(factorySource).toMatch(/new CreateUserGroupUseCase\(/);
    expect(factorySource).toMatch(/new ListGroupMembersUseCase\(/);
    expect(factorySource).toMatch(/new SendGroupInviteUseCase\(/);
    expect(factorySource).toMatch(/UserMovieEntryAuthHook\.createPreHandler/);
    expect(factorySource).toMatch(/UserGroupsController\.create\(/);
  });
});
