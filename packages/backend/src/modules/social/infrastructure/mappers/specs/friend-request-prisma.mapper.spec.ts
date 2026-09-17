import { describe, expect, it } from "vitest";
import { FriendRequestPrismaMapper } from "../friend-request-prisma.mapper";

class FriendRequestPrismaMapperFixtures {
  static prismaFriendRequestRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 55,
      requesterId: 7,
      addresseeId: 12,
      status: "pending",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }

  static prismaUser(overrides: Record<string, unknown> = {}) {
    return {
      id: 12,
      name: "Maria",
      email: "maria@example.com",
      passwordHash: null,
      googleId: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }
}

describe("FriendRequestPrismaMapper", () => {
  describe("toEntity", () => {
    it("mapeia todos os campos da row Prisma para FriendRequestEntity", () => {
      const row = FriendRequestPrismaMapperFixtures.prismaFriendRequestRow({
        status: "accepted",
      });

      const entity = FriendRequestPrismaMapper.toEntity(row as never);

      expect(entity).toEqual({
        id: 55,
        requesterId: 7,
        addresseeId: 12,
        status: "accepted",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      });
    });
  });

  describe("toUserPublic", () => {
    it("expõe apenas id, name e email do usuário Prisma", () => {
      const user = FriendRequestPrismaMapperFixtures.prismaUser();

      const entity = FriendRequestPrismaMapper.toUserPublic(user as never);

      expect(entity).toEqual({
        id: 12,
        name: "Maria",
        email: "maria@example.com",
      });
      expect(entity).not.toHaveProperty("passwordHash");
      expect(entity).not.toHaveProperty("googleId");
    });
  });

  describe("toIncomingEntity", () => {
    it("mapeia solicitação recebida com requester aninhado", () => {
      const row = {
        ...FriendRequestPrismaMapperFixtures.prismaFriendRequestRow(),
        requester: FriendRequestPrismaMapperFixtures.prismaUser({ id: 12 }),
      };

      const entity = FriendRequestPrismaMapper.toIncomingEntity(row as never);

      expect(entity).toEqual({
        id: 55,
        requester: {
          id: 12,
          name: "Maria",
          email: "maria@example.com",
        },
        status: "pending",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      });
    });
  });

  describe("toOutgoingEntity", () => {
    it("mapeia solicitação enviada com addressee aninhado", () => {
      const row = {
        ...FriendRequestPrismaMapperFixtures.prismaFriendRequestRow(),
        addressee: FriendRequestPrismaMapperFixtures.prismaUser({ id: 15 }),
      };

      const entity = FriendRequestPrismaMapper.toOutgoingEntity(row as never);

      expect(entity).toEqual({
        id: 55,
        addressee: {
          id: 15,
          name: "Maria",
          email: "maria@example.com",
        },
        status: "pending",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      });
    });
  });

  describe("toDomainStatus", () => {
    it("converte todos os status Prisma para domínio", () => {
      expect(FriendRequestPrismaMapper.toDomainStatus("pending" as never)).toBe(
        "pending",
      );
      expect(FriendRequestPrismaMapper.toDomainStatus("accepted" as never)).toBe(
        "accepted",
      );
      expect(FriendRequestPrismaMapper.toDomainStatus("rejected" as never)).toBe(
        "rejected",
      );
    });
  });

  describe("toPrismaStatus", () => {
    it("converte todos os status de domínio para Prisma", () => {
      expect(FriendRequestPrismaMapper.toPrismaStatus("pending")).toBe(
        "pending",
      );
      expect(FriendRequestPrismaMapper.toPrismaStatus("accepted")).toBe(
        "accepted",
      );
      expect(FriendRequestPrismaMapper.toPrismaStatus("rejected")).toBe(
        "rejected",
      );
    });
  });
});
