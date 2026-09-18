import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaUtil } from "@/shared/utils/prisma.util";
import { GroupFullException } from "../../../../domain/exceptions/group-full.exception";
import { GroupInviteAlreadyPendingException } from "../../../../domain/exceptions/group-invite-already-pending.exception";
import { GroupInviteNotFoundException } from "../../../../domain/exceptions/group-invite-not-found.exception";
import { UserGroupValidationException } from "../../../../domain/exceptions/user-group-validation.exception";
import { MAX_GROUP_MEMBERS } from "../../../../domain/utils/user-group-validation.utils";
import { PrismaGroupInviteRepository } from "../prisma-group-invite.repository";

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    groupInvite: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    groupMember: {
      count: vi.fn(),
      create: vi.fn(),
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

class GroupInviteRepositoryFixtures {
  static prismaGroupInviteRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 40,
      groupId: 3,
      inviterId: 7,
      inviteeId: 12,
      status: "pending",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-02T10:00:00.000Z"),
      ...overrides,
    };
  }

  static prismaUser(overrides: Record<string, unknown> = {}) {
    return {
      id: 7,
      name: "João",
      email: "joao@example.com",
      ...overrides,
    };
  }
}

describe("PrismaGroupInviteRepository", () => {
  let repository: PrismaGroupInviteRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaGroupInviteRepository();
  });

  describe("findById", () => {
    it("retorna entidade quando convite existe", async () => {
      const row = GroupInviteRepositoryFixtures.prismaGroupInviteRow();
      vi.mocked(prisma.groupInvite.findUnique).mockResolvedValue(row as never);

      const result = await repository.findById(40);

      expect(prisma.groupInvite.findUnique).toHaveBeenCalledWith({
        where: { id: 40 },
      });
      expect(result?.id).toBe(40);
      expect(result?.status).toBe("pending");
    });

    it("retorna null quando convite não existe", async () => {
      vi.mocked(prisma.groupInvite.findUnique).mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it("rejeita id inválido antes de consultar o banco", async () => {
      await expect(repository.findById(0)).rejects.toThrow(
        UserGroupValidationException,
      );
      expect(prisma.groupInvite.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("createPending", () => {
    it("REQ-3: cria convite pending e registra log", async () => {
      const row = GroupInviteRepositoryFixtures.prismaGroupInviteRow();
      vi.mocked(prisma.groupInvite.create).mockResolvedValue(row as never);

      const result = await repository.createPending(3, 7, 12);

      expect(prisma.groupInvite.create).toHaveBeenCalledWith({
        data: {
          groupId: 3,
          inviterId: 7,
          inviteeId: 12,
          status: "pending",
        },
      });
      expect(result.status).toBe("pending");
      expect(Logger.info).toHaveBeenCalledWith(
        "Group invite created",
        expect.objectContaining({
          groupInviteId: 40,
          groupId: 3,
          inviterId: 7,
          inviteeId: 12,
        }),
      );
    });

    it("edge: rejeita auto-convite", async () => {
      await expect(repository.createPending(3, 7, 7)).rejects.toThrow(
        UserGroupValidationException,
      );
      expect(prisma.groupInvite.create).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("REQ-4: atualiza status para accepted", async () => {
      const row = GroupInviteRepositoryFixtures.prismaGroupInviteRow({
        status: "accepted",
      });
      vi.mocked(prisma.groupInvite.update).mockResolvedValue(row as never);

      const result = await repository.updateStatus(40, "accepted");

      expect(prisma.groupInvite.update).toHaveBeenCalledWith({
        where: { id: 40 },
        data: { status: "accepted" },
      });
      expect(result.status).toBe("accepted");
    });

    it("REQ-5: atualiza status para rejected", async () => {
      const row = GroupInviteRepositoryFixtures.prismaGroupInviteRow({
        status: "rejected",
      });
      vi.mocked(prisma.groupInvite.update).mockResolvedValue(row as never);

      const result = await repository.updateStatus(40, "rejected");

      expect(result.status).toBe("rejected");
    });

    it("lança GroupInviteNotFoundException quando Prisma retorna P2025", async () => {
      const prismaError = createPrismaRecordNotFoundError();
      vi.mocked(prisma.groupInvite.update).mockRejectedValue(prismaError);

      await expect(repository.updateStatus(999, "accepted")).rejects.toThrow(
        GroupInviteNotFoundException,
      );
    });

    it("repassa erro não-P2025 sem mapear", async () => {
      const connectionError = new Error("connection failed");
      vi.mocked(prisma.groupInvite.update).mockRejectedValue(connectionError);

      await expect(repository.updateStatus(40, "accepted")).rejects.toThrow(
        connectionError,
      );
    });
  });

  describe("deleteById", () => {
    it("REQ-6: remove convite e registra log", async () => {
      vi.mocked(prisma.groupInvite.delete).mockResolvedValue(
        GroupInviteRepositoryFixtures.prismaGroupInviteRow() as never,
      );

      await repository.deleteById(41);

      expect(prisma.groupInvite.delete).toHaveBeenCalledWith({
        where: { id: 41 },
      });
      expect(Logger.info).toHaveBeenCalledWith("Group invite deleted", {
        groupInviteId: 41,
      });
    });

    it("lança GroupInviteNotFoundException quando Prisma retorna P2025", async () => {
      const prismaError = createPrismaRecordNotFoundError();
      vi.mocked(prisma.groupInvite.delete).mockRejectedValue(prismaError);

      await expect(repository.deleteById(999)).rejects.toThrow(
        GroupInviteNotFoundException,
      );
    });
  });

  describe("listIncomingPending", () => {
    it("REQ-12: lista convites pending com grupo e inviter", async () => {
      const row = {
        ...GroupInviteRepositoryFixtures.prismaGroupInviteRow(),
        group: { id: 3, name: "Sábado cinema" },
        inviter: GroupInviteRepositoryFixtures.prismaUser(),
      };
      vi.mocked(prisma.groupInvite.findMany).mockResolvedValue([row] as never);

      const result = await repository.listIncomingPending(12);

      expect(prisma.groupInvite.findMany).toHaveBeenCalledWith({
        where: { inviteeId: 12, status: "pending" },
        include: {
          group: { select: { id: true, name: true } },
          inviter: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.group.name).toBe("Sábado cinema");
      expect(result[0]?.inviter.email).toBe("joao@example.com");
    });
  });

  describe("hasPendingInvite", () => {
    it("retorna true quando existe convite pending", async () => {
      vi.mocked(prisma.groupInvite.count).mockResolvedValue(1);

      const result = await repository.hasPendingInvite(3, 12);

      expect(prisma.groupInvite.count).toHaveBeenCalledWith({
        where: { groupId: 3, inviteeId: 12, status: "pending" },
      });
      expect(result).toBe(true);
    });

    it("retorna false quando não há convite pending", async () => {
      vi.mocked(prisma.groupInvite.count).mockResolvedValue(0);

      const result = await repository.hasPendingInvite(3, 12);

      expect(result).toBe(false);
    });
  });

  describe("acceptPendingAndAddMember", () => {
    it("aceita convite e adiciona membro em transação", async () => {
      const acceptedRow = GroupInviteRepositoryFixtures.prismaGroupInviteRow({
        status: "accepted",
      });
      const txMemberCount = vi.fn().mockResolvedValue(5);
      const txInviteUpdate = vi.fn().mockResolvedValue(acceptedRow);
      const txMemberCreate = vi.fn().mockResolvedValue({});
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          groupMember: { count: txMemberCount, create: txMemberCreate },
          groupInvite: { update: txInviteUpdate },
        };
        return callback(tx as never);
      });

      const result = await repository.acceptPendingAndAddMember(40, 3, 12);

      expect(txMemberCount).toHaveBeenCalledWith({ where: { groupId: 3 } });
      expect(txInviteUpdate).toHaveBeenCalledWith({
        where: { id: 40 },
        data: { status: "accepted" },
      });
      expect(txMemberCreate).toHaveBeenCalledWith({
        data: { groupId: 3, userId: 12 },
      });
      expect(result.status).toBe("accepted");
    });

    it("lança GroupFullException quando grupo está cheio", async () => {
      const txMemberCount = vi.fn().mockResolvedValue(MAX_GROUP_MEMBERS);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          groupMember: { count: txMemberCount, create: vi.fn() },
          groupInvite: { update: vi.fn() },
        };
        return callback(tx as never);
      });

      await expect(
        repository.acceptPendingAndAddMember(40, 3, 12),
      ).rejects.toThrow(GroupFullException);
    });
  });

  describe("createPendingIfAvailable", () => {
    it("cria convite pending quando grupo tem espaço e não há convite duplicado", async () => {
      const row = GroupInviteRepositoryFixtures.prismaGroupInviteRow();
      const txMemberCount = vi.fn().mockResolvedValue(5);
      const txInviteCount = vi.fn().mockResolvedValue(0);
      const txInviteCreate = vi.fn().mockResolvedValue(row);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          groupMember: { count: txMemberCount },
          groupInvite: { count: txInviteCount, create: txInviteCreate },
        };
        return callback(tx as never);
      });

      const result = await repository.createPendingIfAvailable(3, 7, 12);

      expect(txInviteCreate).toHaveBeenCalledWith({
        data: {
          groupId: 3,
          inviterId: 7,
          inviteeId: 12,
          status: "pending",
        },
      });
      expect(result.status).toBe("pending");
    });

    it("lança GroupInviteAlreadyPendingException quando já existe convite pending", async () => {
      const txMemberCount = vi.fn().mockResolvedValue(5);
      const txInviteCount = vi.fn().mockResolvedValue(1);
      const txInviteCreate = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          groupMember: { count: txMemberCount },
          groupInvite: { count: txInviteCount, create: txInviteCreate },
        };
        return callback(tx as never);
      });

      await expect(
        repository.createPendingIfAvailable(3, 7, 12),
      ).rejects.toThrow(GroupInviteAlreadyPendingException);

      expect(txInviteCount).toHaveBeenCalledWith({
        where: { groupId: 3, inviteeId: 12, status: "pending" },
      });
      expect(txInviteCreate).not.toHaveBeenCalled();
    });

    it("edge: verifica duplicata pending dentro da transação antes de create (race na app)", async () => {
      const row = GroupInviteRepositoryFixtures.prismaGroupInviteRow();
      const txMemberCount = vi.fn().mockResolvedValue(5);
      const txInviteCount = vi.fn().mockResolvedValue(0);
      const txInviteCreate = vi.fn().mockResolvedValue(row);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          groupMember: { count: txMemberCount },
          groupInvite: { count: txInviteCount, create: txInviteCreate },
        };
        return callback(tx as never);
      });

      await repository.createPendingIfAvailable(3, 7, 12);

      expect(txMemberCount).toHaveBeenCalledBefore(txInviteCount);
      expect(txInviteCount).toHaveBeenCalledBefore(txInviteCreate);
      expect(txInviteCount).toHaveBeenCalledWith({
        where: { groupId: 3, inviteeId: 12, status: "pending" },
      });
    });

    it("lança GroupFullException quando grupo está cheio", async () => {
      const txMemberCount = vi.fn().mockResolvedValue(MAX_GROUP_MEMBERS);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          groupMember: { count: txMemberCount },
          groupInvite: { count: vi.fn(), create: vi.fn() },
        };
        return callback(tx as never);
      });

      await expect(
        repository.createPendingIfAvailable(3, 7, 12),
      ).rejects.toThrow(GroupFullException);
    });
  });
});
