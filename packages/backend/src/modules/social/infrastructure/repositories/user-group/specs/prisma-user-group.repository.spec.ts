import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaUtil } from "@/shared/utils/prisma.util";
import { UserGroupNotFoundException } from "../../../../domain/exceptions/user-group-not-found.exception";
import { UserGroupValidationException } from "../../../../domain/exceptions/user-group-validation.exception";
import { PrismaUserGroupRepository } from "../prisma-user-group.repository";

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
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function createPrismaRecordNotFoundError() {
  return { code: PrismaUtil.RECORD_NOT_FOUND_CODE };
}

class UserGroupRepositoryFixtures {
  static prismaUserGroupRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 7,
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-02T10:00:00.000Z"),
      ...overrides,
    };
  }

  static prismaGroupMemberRow(overrides: Record<string, unknown> = {}) {
    return {
      groupId: 3,
      userId: 7,
      joinedAt: new Date("2026-03-01T10:00:00.000Z"),
      ...overrides,
    };
  }
}

describe("PrismaUserGroupRepository", () => {
  let repository: PrismaUserGroupRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaUserGroupRepository();
  });

  describe("findById", () => {
    it("retorna entidade quando grupo existe", async () => {
      const row = UserGroupRepositoryFixtures.prismaUserGroupRow();
      vi.mocked(prisma.userGroup.findUnique).mockResolvedValue(row as never);

      const result = await repository.findById(3);

      expect(prisma.userGroup.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
      });
      expect(result?.id).toBe(3);
      expect(result?.ownerId).toBe(7);
    });

    it("retorna null quando grupo não existe", async () => {
      vi.mocked(prisma.userGroup.findUnique).mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it("rejeita groupId inválido antes de consultar o banco", async () => {
      await expect(repository.findById(0)).rejects.toThrow(
        UserGroupValidationException,
      );
      expect(prisma.userGroup.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("createWithOwner", () => {
    it("REQ-1: cria grupo e membro dono em transação", async () => {
      const groupRow = UserGroupRepositoryFixtures.prismaUserGroupRow();
      const txCreate = vi.fn().mockResolvedValue(groupRow);
      const txMemberCreate = vi.fn().mockResolvedValue(
        UserGroupRepositoryFixtures.prismaGroupMemberRow(),
      );
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          userGroup: { create: txCreate },
          groupMember: { create: txMemberCreate },
        };
        return callback(tx as never);
      });

      const result = await repository.createWithOwner(
        7,
        "Sábado cinema",
        "Filmes do fim de semana",
      );

      expect(txCreate).toHaveBeenCalledWith({
        data: {
          name: "Sábado cinema",
          ownerId: 7,
          description: "Filmes do fim de semana",
        },
      });
      expect(txMemberCreate).toHaveBeenCalledWith({
        data: { groupId: 3, userId: 7 },
      });
      expect(result.id).toBe(3);
      expect(Logger.info).toHaveBeenCalledWith(
        "User group created with owner",
        expect.objectContaining({ groupId: 3, ownerId: 7 }),
      );
    });
  });

  describe("listGroupsForUser", () => {
    it("REQ-2: lista grupos do usuário com memberCount", async () => {
      const memberRow = {
        ...UserGroupRepositoryFixtures.prismaGroupMemberRow(),
        group: {
          ...UserGroupRepositoryFixtures.prismaUserGroupRow(),
          _count: { members: 2 },
        },
      };
      vi.mocked(prisma.groupMember.findMany).mockResolvedValue([
        memberRow,
      ] as never);

      const result = await repository.listGroupsForUser(7);

      expect(prisma.groupMember.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
        include: {
          group: {
            include: {
              _count: { select: { members: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.memberCount).toBe(2);
    });
  });

  describe("findMembership", () => {
    it("retorna membership quando usuário é membro", async () => {
      const row = UserGroupRepositoryFixtures.prismaGroupMemberRow({
        userId: 12,
      });
      vi.mocked(prisma.groupMember.findUnique).mockResolvedValue(row as never);

      const result = await repository.findMembership(3, 12);

      expect(prisma.groupMember.findUnique).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId: 3, userId: 12 } },
      });
      expect(result?.userId).toBe(12);
    });

    it("retorna null quando usuário não é membro", async () => {
      vi.mocked(prisma.groupMember.findUnique).mockResolvedValue(null);

      const result = await repository.findMembership(3, 99);

      expect(result).toBeNull();
    });
  });

  describe("isOwner", () => {
    it("retorna true quando usuário é dono", async () => {
      vi.mocked(prisma.userGroup.findUnique).mockResolvedValue({
        ownerId: 7,
      } as never);

      const result = await repository.isOwner(3, 7);

      expect(result).toBe(true);
    });

    it("retorna false quando usuário não é dono", async () => {
      vi.mocked(prisma.userGroup.findUnique).mockResolvedValue({
        ownerId: 7,
      } as never);

      const result = await repository.isOwner(3, 12);

      expect(result).toBe(false);
    });

    it("retorna false quando grupo não existe", async () => {
      vi.mocked(prisma.userGroup.findUnique).mockResolvedValue(null);

      const result = await repository.isOwner(999, 7);

      expect(result).toBe(false);
    });
  });

  describe("countMembers", () => {
    it("retorna contagem de membros do grupo", async () => {
      vi.mocked(prisma.groupMember.count).mockResolvedValue(5);

      const result = await repository.countMembers(3);

      expect(prisma.groupMember.count).toHaveBeenCalledWith({
        where: { groupId: 3 },
      });
      expect(result).toBe(5);
    });
  });

  describe("updateGroup", () => {
    it("atualiza nome e descrição do grupo", async () => {
      const row = UserGroupRepositoryFixtures.prismaUserGroupRow({
        name: "Domingo série",
        description: "Maratonas de TV",
      });
      vi.mocked(prisma.userGroup.update).mockResolvedValue(row as never);

      const result = await repository.updateGroup(3, {
        name: "Domingo série",
        description: "Maratonas de TV",
      });

      expect(prisma.userGroup.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: {
          name: "Domingo série",
          description: "Maratonas de TV",
        },
      });
      expect(result.name).toBe("Domingo série");
      expect(Logger.info).toHaveBeenCalledWith("User group updated", {
        groupId: 3,
      });
    });

    it("lança UserGroupNotFoundException quando Prisma retorna P2025", async () => {
      const prismaError = createPrismaRecordNotFoundError();
      vi.mocked(prisma.userGroup.update).mockRejectedValue(prismaError);

      await expect(
        repository.updateGroup(999, { name: "Inexistente" }),
      ).rejects.toThrow(UserGroupNotFoundException);
    });

    it("repassa erro não-P2025 sem mapear", async () => {
      const connectionError = new Error("connection failed");
      vi.mocked(prisma.userGroup.update).mockRejectedValue(connectionError);

      await expect(
        repository.updateGroup(3, { name: "Teste" }),
      ).rejects.toThrow(connectionError);
    });
  });

  describe("deleteGroup", () => {
    it("remove grupo existente e registra log", async () => {
      vi.mocked(prisma.userGroup.delete).mockResolvedValue(
        UserGroupRepositoryFixtures.prismaUserGroupRow() as never,
      );

      await repository.deleteGroup(3);

      expect(prisma.userGroup.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
      expect(Logger.info).toHaveBeenCalledWith("User group deleted", {
        groupId: 3,
      });
    });

    it("lança UserGroupNotFoundException quando Prisma retorna P2025", async () => {
      const prismaError = createPrismaRecordNotFoundError();
      vi.mocked(prisma.userGroup.delete).mockRejectedValue(prismaError);

      await expect(repository.deleteGroup(999)).rejects.toThrow(
        UserGroupNotFoundException,
      );
    });
  });

  describe("transferOwnership", () => {
    it("REQ-8: atualiza ownerId do grupo", async () => {
      const row = UserGroupRepositoryFixtures.prismaUserGroupRow({
        ownerId: 12,
      });
      vi.mocked(prisma.userGroup.update).mockResolvedValue(row as never);

      const result = await repository.transferOwnership(3, 12);

      expect(prisma.userGroup.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { ownerId: 12 },
      });
      expect(result.ownerId).toBe(12);
    });

    it("lança UserGroupNotFoundException quando Prisma retorna P2025", async () => {
      const prismaError = createPrismaRecordNotFoundError();
      vi.mocked(prisma.userGroup.update).mockRejectedValue(prismaError);

      await expect(repository.transferOwnership(999, 12)).rejects.toThrow(
        UserGroupNotFoundException,
      );
    });
  });

  describe("findOldestMemberAfterOwner", () => {
    it("REQ-8: busca membro mais antigo excluindo o dono atual", async () => {
      const row = UserGroupRepositoryFixtures.prismaGroupMemberRow({
        userId: 12,
        joinedAt: new Date("2026-03-02T10:00:00.000Z"),
      });
      vi.mocked(prisma.groupMember.findFirst).mockResolvedValue(row as never);

      const result = await repository.findOldestMemberAfterOwner(3, 7);

      expect(prisma.groupMember.findFirst).toHaveBeenCalledWith({
        where: { groupId: 3, userId: { not: 7 } },
        orderBy: { joinedAt: "asc" },
      });
      expect(result?.userId).toBe(12);
    });
  });

  describe("deleteGroupAndRelated", () => {
    it("edge: dono único dissolve grupo via deleteGroup", async () => {
      vi.mocked(prisma.userGroup.delete).mockResolvedValue(
        UserGroupRepositoryFixtures.prismaUserGroupRow() as never,
      );

      await repository.deleteGroupAndRelated(3);

      expect(prisma.userGroup.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });
  });

  describe("findMemberUserIds", () => {
    it("retorna ids dos membros do grupo", async () => {
      vi.mocked(prisma.groupMember.findMany).mockResolvedValue([
        { userId: 7 },
        { userId: 12 },
      ] as never);

      const result = await repository.findMemberUserIds(3);

      expect(prisma.groupMember.findMany).toHaveBeenCalledWith({
        where: { groupId: 3 },
        select: { userId: true },
      });
      expect(result).toEqual([7, 12]);
    });
  });

  describe("findMemberProfiles", () => {
    it("REQ-4: retorna perfis UserPublic com join em User", async () => {
      vi.mocked(prisma.groupMember.findMany).mockResolvedValue([
        {
          groupId: 3,
          userId: 7,
          joinedAt: new Date("2026-03-01T10:00:00.000Z"),
          user: { id: 7, name: "João", email: "joao@example.com" },
        },
        {
          groupId: 3,
          userId: 12,
          joinedAt: new Date("2026-03-02T10:00:00.000Z"),
          user: { id: 12, name: "Maria", email: "maria@example.com" },
        },
      ] as never);

      const result = await repository.findMemberProfiles(3);

      expect(prisma.groupMember.findMany).toHaveBeenCalledWith({
        where: { groupId: 3 },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { user: { name: "asc" } },
      });
      expect(result).toEqual([
        { id: 7, name: "João", email: "joao@example.com" },
        { id: 12, name: "Maria", email: "maria@example.com" },
      ]);
    });

    it("REQ-1: ordem name asc delegada ao Prisma", async () => {
      vi.mocked(prisma.groupMember.findMany).mockResolvedValue([
        {
          groupId: 3,
          userId: 12,
          joinedAt: new Date("2026-03-02T10:00:00.000Z"),
          user: { id: 12, name: "Ana", email: "ana@example.com" },
        },
        {
          groupId: 3,
          userId: 7,
          joinedAt: new Date("2026-03-01T10:00:00.000Z"),
          user: { id: 7, name: "João", email: "joao@example.com" },
        },
      ] as never);

      const result = await repository.findMemberProfiles(3);

      expect(result[0]?.name).toBe("Ana");
      expect(result[1]?.name).toBe("João");
    });

    it("edge: rejeita groupId inválido", async () => {
      await expect(repository.findMemberProfiles(0)).rejects.toThrow(
        UserGroupValidationException,
      );
      expect(prisma.groupMember.findMany).not.toHaveBeenCalled();
    });
  });

  describe("leaveAsOwnerWithTransfer", () => {
    it("transfere ownership e remove dono em transação", async () => {
      const nextOwnerRow = UserGroupRepositoryFixtures.prismaGroupMemberRow({
        userId: 12,
      });
      const txFindFirst = vi.fn().mockResolvedValue(nextOwnerRow);
      const txGroupUpdate = vi.fn().mockResolvedValue(
        UserGroupRepositoryFixtures.prismaUserGroupRow({ ownerId: 12 }),
      );
      const txMemberDelete = vi.fn().mockResolvedValue({});
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          groupMember: { findFirst: txFindFirst, delete: txMemberDelete },
          userGroup: { update: txGroupUpdate },
        };
        return callback(tx as never);
      });

      await repository.leaveAsOwnerWithTransfer(3, 7);

      expect(txFindFirst).toHaveBeenCalledWith({
        where: { groupId: 3, userId: { not: 7 } },
        orderBy: { joinedAt: "asc" },
      });
      expect(txGroupUpdate).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { ownerId: 12 },
      });
      expect(txMemberDelete).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId: 3, userId: 7 } },
      });
    });
  });
});
