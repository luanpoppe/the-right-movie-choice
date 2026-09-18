import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { FriendRequestValidationException } from "../../../../domain/exceptions/friend-request-validation.exception";
import { PrismaFriendRequestRepository } from "../prisma-friend-request.repository";

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    friendRequest: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
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

class FriendRequestRepositoryFixtures {
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

  static entityFromRow(
    row: ReturnType<typeof FriendRequestRepositoryFixtures.prismaFriendRequestRow>,
  ) {
    const statusMap: Record<string, string> = {
      pending: "pending",
      accepted: "accepted",
      rejected: "rejected",
    };

    return {
      id: row.id,
      requesterId: row.requesterId,
      addresseeId: row.addresseeId,
      status: statusMap[row.status as string],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
};

describe("PrismaFriendRequestRepository", () => {
  let repository: PrismaFriendRequestRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaFriendRequestRepository();
  });

  describe("findById", () => {
    it("retorna entidade quando existe solicitação", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow();
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValue(row as never);

      const result = await repository.findById(55);

      expect(prisma.friendRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 55 },
      });
      expect(result).toEqual(
        FriendRequestRepositoryFixtures.entityFromRow(row),
      );
    });

    it("retorna null quando solicitação não existe", async () => {
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it("rejeita id inválido antes de consultar o banco", async () => {
      await expect(repository.findById(0)).rejects.toThrow(
        FriendRequestValidationException,
      );
      expect(prisma.friendRequest.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("findLatestBetweenUsers", () => {
    it("busca a solicitação mais recente entre dois usuários em qualquer direção", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow({
        requesterId: 12,
        addresseeId: 7,
      });
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(row as never);

      const result = await repository.findLatestBetweenUsers(7, 12);

      expect(prisma.friendRequest.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { requesterId: 7, addresseeId: 12 },
            { requesterId: 12, addresseeId: 7 },
          ],
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
      expect(result).toEqual(
        FriendRequestRepositoryFixtures.entityFromRow(row),
      );
    });

    it("retorna null quando não há solicitação entre os usuários", async () => {
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(null);

      const result = await repository.findLatestBetweenUsers(7, 12);

      expect(result).toBeNull();
    });
  });

  describe("createPending", () => {
    it("REQ-1: cria solicitação pendente e registra log", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow();
      vi.mocked(prisma.friendRequest.create).mockResolvedValue(row as never);

      const result = await repository.createPending(7, 12);

      expect(prisma.friendRequest.create).toHaveBeenCalledWith({
        data: {
          requesterId: 7,
          addresseeId: 12,
          status: "pending",
        },
      });
      expect(result).toEqual(
        FriendRequestRepositoryFixtures.entityFromRow(row),
      );
      expect(Logger.info).toHaveBeenCalledWith("Friend request created", {
        friendRequestId: 55,
        requesterId: 7,
        addresseeId: 12,
      });
    });

    it("edge: rejeita solicitação para si mesmo", async () => {
      await expect(repository.createPending(7, 7)).rejects.toThrow(
        FriendRequestValidationException,
      );
      expect(prisma.friendRequest.create).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("REQ-2: atualiza status para accepted", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow({
        status: "accepted",
      });
      vi.mocked(prisma.friendRequest.update).mockResolvedValue(row as never);

      const result = await repository.updateStatus(55, "accepted");

      expect(prisma.friendRequest.update).toHaveBeenCalledWith({
        where: { id: 55 },
        data: { status: "accepted" },
      });
      expect(result.status).toBe("accepted");
      expect(Logger.info).toHaveBeenCalledWith("Friend request status updated", {
        friendRequestId: 55,
        status: "accepted",
      });
    });

    it("REQ-3: atualiza status para rejected", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow({
        status: "rejected",
      });
      vi.mocked(prisma.friendRequest.update).mockResolvedValue(row as never);

      const result = await repository.updateStatus(55, "rejected");

      expect(result.status).toBe("rejected");
    });
  });

  describe("deleteById", () => {
    it("REQ-4: remove solicitação e registra log", async () => {
      vi.mocked(prisma.friendRequest.delete).mockResolvedValue(
        FriendRequestRepositoryFixtures.prismaFriendRequestRow() as never,
      );

      await repository.deleteById(56);

      expect(prisma.friendRequest.delete).toHaveBeenCalledWith({
        where: { id: 56 },
      });
      expect(Logger.info).toHaveBeenCalledWith("Friend request deleted", {
        friendRequestId: 56,
      });
    });
  });

  describe("listAcceptedFriends", () => {
    it("REQ-6: retorna o outro usuário quando viewer é requester", async () => {
      const addressee = FriendRequestRepositoryFixtures.prismaUser({ id: 12 });
      const row = {
        ...FriendRequestRepositoryFixtures.prismaFriendRequestRow({
          requesterId: 7,
          addresseeId: 12,
          status: "accepted",
        }),
        requester: FriendRequestRepositoryFixtures.prismaUser({ id: 7 }),
        addressee,
      };
      vi.mocked(prisma.friendRequest.findMany).mockResolvedValue([row] as never);

      const result = await repository.listAcceptedFriends(7);

      expect(prisma.friendRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: "accepted",
          OR: [{ requesterId: 7 }, { addresseeId: 7 }],
        },
        include: {
          requester: { select: userPublicSelect },
          addressee: { select: userPublicSelect },
        },
      });
      expect(result).toEqual([
        {
          id: 12,
          name: "Maria",
          email: "maria@example.com",
        },
      ]);
    });

    it("REQ-6: retorna o outro usuário quando viewer é addressee", async () => {
      const requester = FriendRequestRepositoryFixtures.prismaUser({ id: 12 });
      const row = {
        ...FriendRequestRepositoryFixtures.prismaFriendRequestRow({
          requesterId: 12,
          addresseeId: 7,
          status: "accepted",
        }),
        requester,
        addressee: FriendRequestRepositoryFixtures.prismaUser({ id: 7 }),
      };
      vi.mocked(prisma.friendRequest.findMany).mockResolvedValue([row] as never);

      const result = await repository.listAcceptedFriends(7);

      expect(result[0]?.id).toBe(12);
    });

    it("REQ-6: retorna array vazio quando não há amizades aceitas", async () => {
      vi.mocked(prisma.friendRequest.findMany).mockResolvedValue([]);

      const result = await repository.listAcceptedFriends(7);

      expect(result).toEqual([]);
    });
  });

  describe("listIncomingPending", () => {
    it("REQ-7: lista pendentes recebidas com requester e ordenação desc", async () => {
      const row = {
        ...FriendRequestRepositoryFixtures.prismaFriendRequestRow({
          requesterId: 12,
          addresseeId: 7,
        }),
        requester: FriendRequestRepositoryFixtures.prismaUser({ id: 12 }),
      };
      vi.mocked(prisma.friendRequest.findMany).mockResolvedValue([row] as never);

      const result = await repository.listIncomingPending(7);

      expect(prisma.friendRequest.findMany).toHaveBeenCalledWith({
        where: {
          addresseeId: 7,
          status: "pending",
        },
        include: { requester: { select: userPublicSelect } },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.requester.id).toBe(12);
      expect(result[0]?.status).toBe("pending");
    });
  });

  describe("listOutgoingPending", () => {
    it("REQ-8: lista pendentes enviadas com addressee e ordenação desc", async () => {
      const row = {
        ...FriendRequestRepositoryFixtures.prismaFriendRequestRow({
          requesterId: 7,
          addresseeId: 15,
        }),
        addressee: FriendRequestRepositoryFixtures.prismaUser({ id: 15 }),
      };
      vi.mocked(prisma.friendRequest.findMany).mockResolvedValue([row] as never);

      const result = await repository.listOutgoingPending(7);

      expect(prisma.friendRequest.findMany).toHaveBeenCalledWith({
        where: {
          requesterId: 7,
          status: "pending",
        },
        include: { addressee: { select: userPublicSelect } },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.addressee.id).toBe(15);
    });
  });

  describe("resolveRelationshipStatus", () => {
    it("REQ-9: retorna none quando não há solicitação entre os usuários", async () => {
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(null);

      const result = await repository.resolveRelationshipStatus(7, 12);

      expect(result).toBe("none");
    });

    it("REQ-9: retorna friends quando última solicitação está accepted", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow({
        status: "accepted",
      });
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(row as never);

      const result = await repository.resolveRelationshipStatus(7, 12);

      expect(result).toBe("friends");
    });

    it("REQ-9: retorna rejected quando última solicitação está rejected", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow({
        status: "rejected",
      });
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(row as never);

      const result = await repository.resolveRelationshipStatus(7, 12);

      expect(result).toBe("rejected");
    });

    it("REQ-9: retorna pending_outgoing quando viewer é requester", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow({
        requesterId: 7,
        addresseeId: 12,
        status: "pending",
      });
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(row as never);

      const result = await repository.resolveRelationshipStatus(7, 12);

      expect(result).toBe("pending_outgoing");
    });

    it("REQ-9: retorna pending_incoming quando viewer é addressee", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow({
        requesterId: 12,
        addresseeId: 7,
        status: "pending",
      });
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(row as never);

      const result = await repository.resolveRelationshipStatus(7, 12);

      expect(result).toBe("pending_incoming");
    });

    it("REQ-11: retorna rejected (não pending) quando última solicitação foi recusada", async () => {
      const row = FriendRequestRepositoryFixtures.prismaFriendRequestRow({
        requesterId: 7,
        addresseeId: 12,
        status: "rejected",
      });
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(row as never);

      const result = await repository.resolveRelationshipStatus(7, 12);

      expect(result).toBe("rejected");
      expect(result).not.toBe("pending_outgoing");
    });
  });
});
