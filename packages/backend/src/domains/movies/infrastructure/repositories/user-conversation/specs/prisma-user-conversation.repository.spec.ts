import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { UserConversationChatIdConflictException } from "../../../../domain/exceptions/user-conversation-chat-id-conflict.exception";
import { UserConversationValidationException } from "../../../../domain/exceptions/user-conversation-validation.exception";
import { PrismaUtil } from "@/shared/utils/prisma.util";
import { PrismaUserConversationRepository } from "../prisma-user-conversation.repository";

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    userConversation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
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

class UserConversationRepositoryFixtures {
  static prismaRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 12,
      userId: 7,
      chatId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
      title: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }

  static entityFromRow(
    row: ReturnType<typeof UserConversationRepositoryFixtures.prismaRow>,
  ) {
    return {
      id: row.id,
      userId: row.userId,
      chatId: row.chatId,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

describe("PrismaUserConversationRepository", () => {
  let repository: PrismaUserConversationRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaUserConversationRepository();
  });

  describe("create", () => {
    it("cria conversa sem título", async () => {
      const row = UserConversationRepositoryFixtures.prismaRow();
      vi.mocked(prisma.userConversation.create).mockResolvedValue(row as never);

      const result = await repository.create({
        userId: 7,
        chatId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
      });

      expect(prisma.userConversation.create).toHaveBeenCalledWith({
        data: {
          userId: 7,
          chatId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
          title: null,
        },
      });
      expect(result).toEqual(UserConversationRepositoryFixtures.entityFromRow(row));
      expect(Logger.info).toHaveBeenCalledWith("User conversation created", {
        userId: 7,
        chatId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
        conversationId: 12,
      });
    });

    it("rejeita chatId inválido antes do Prisma", async () => {
      await expect(
        repository.create({ userId: 7, chatId: "not-a-uuid" }),
      ).rejects.toThrow(UserConversationValidationException);

      expect(prisma.userConversation.create).not.toHaveBeenCalled();
    });

    it("rejeita userId inválido antes do Prisma", async () => {
      await expect(
        repository.create({
          userId: 0,
          chatId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
        }),
      ).rejects.toThrow(UserConversationValidationException);

      expect(prisma.userConversation.create).not.toHaveBeenCalled();
    });

    it("cria conversa com título opcional válido", async () => {
      const row = UserConversationRepositoryFixtures.prismaRow({
        title: "Filmes de ficção dos anos 90",
      });
      vi.mocked(prisma.userConversation.create).mockResolvedValue(row as never);

      const result = await repository.create({
        userId: 7,
        chatId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
        title: "Filmes de ficção dos anos 90",
      });

      expect(prisma.userConversation.create).toHaveBeenCalledWith({
        data: {
          userId: 7,
          chatId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
          title: "Filmes de ficção dos anos 90",
        },
      });
      expect(result).toEqual(UserConversationRepositoryFixtures.entityFromRow(row));
    });

    it("P2002 lança UserConversationChatIdConflictException", async () => {
      const chatId = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";
      const prismaError = { code: PrismaUtil.UNIQUE_CONSTRAINT_CODE };
      vi.mocked(prisma.userConversation.create).mockRejectedValue(prismaError);

      await expect(
        repository.create({ userId: 7, chatId }),
      ).rejects.toThrow(UserConversationChatIdConflictException);
      await expect(
        repository.create({ userId: 7, chatId }),
      ).rejects.toThrow(`User conversation with chatId "${chatId}" already exists`);
    });
  });

  describe("findById", () => {
    it("retorna entidade quando pertence ao usuário", async () => {
      const row = UserConversationRepositoryFixtures.prismaRow();
      vi.mocked(prisma.userConversation.findFirst).mockResolvedValue(
        row as never,
      );

      const result = await repository.findById(7, 12);

      expect(prisma.userConversation.findFirst).toHaveBeenCalledWith({
        where: { id: 12, userId: 7 },
      });
      expect(result).toEqual(UserConversationRepositoryFixtures.entityFromRow(row));
    });

    it("retorna null quando não encontra", async () => {
      vi.mocked(prisma.userConversation.findFirst).mockResolvedValue(null);

      const result = await repository.findById(7, 99);

      expect(result).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith(
        "User conversation find by id miss",
        { userId: 7, id: 99 },
      );
    });

    it("retorna null quando conversa pertence a outro usuário", async () => {
      vi.mocked(prisma.userConversation.findFirst).mockResolvedValue(null);

      const result = await repository.findById(99, 12);

      expect(prisma.userConversation.findFirst).toHaveBeenCalledWith({
        where: { id: 12, userId: 99 },
      });
      expect(result).toBeNull();
    });

    it("rejeita userId inválido antes do Prisma", async () => {
      await expect(repository.findById(0, 12)).rejects.toThrow(
        UserConversationValidationException,
      );

      expect(prisma.userConversation.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("findByChatId", () => {
    it("filtra por userId mesmo com chatId globalmente único", async () => {
      vi.mocked(prisma.userConversation.findFirst).mockResolvedValue(null);

      const chatId = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";
      const result = await repository.findByChatId(99, chatId);

      expect(prisma.userConversation.findFirst).toHaveBeenCalledWith({
        where: { chatId, userId: 99 },
      });
      expect(result).toBeNull();
    });

    it("retorna entidade quando chatId pertence ao usuário", async () => {
      const row = UserConversationRepositoryFixtures.prismaRow();
      vi.mocked(prisma.userConversation.findFirst).mockResolvedValue(
        row as never,
      );

      const chatId = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";
      const result = await repository.findByChatId(7, chatId);

      expect(result).toEqual(UserConversationRepositoryFixtures.entityFromRow(row));
      expect(Logger.debug).toHaveBeenCalledWith(
        "User conversation find by chatId hit",
        { userId: 7, chatId },
      );
    });

    it("rejeita userId inválido antes do Prisma", async () => {
      await expect(
        repository.findByChatId(0, "a1b2c3d4-e5f6-4789-abcd-ef1234567890"),
      ).rejects.toThrow(UserConversationValidationException);

      expect(prisma.userConversation.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("listByUserId", () => {
    it("lista por updatedAt descendente", async () => {
      const rowA = UserConversationRepositoryFixtures.prismaRow({
        id: 1,
        updatedAt: new Date("2026-03-03T00:00:00.000Z"),
      });
      const rowB = UserConversationRepositoryFixtures.prismaRow({
        id: 2,
        updatedAt: new Date("2026-02-02T00:00:00.000Z"),
      });
      vi.mocked(prisma.userConversation.findMany).mockResolvedValue([
        rowA,
        rowB,
      ] as never);

      const result = await repository.listByUserId(7);

      expect(prisma.userConversation.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toEqual([
        UserConversationRepositoryFixtures.entityFromRow(rowA),
        UserConversationRepositoryFixtures.entityFromRow(rowB),
      ]);
    });

    it("filtra apenas conversas do userId informado", async () => {
      vi.mocked(prisma.userConversation.findMany).mockResolvedValue([] as never);

      await repository.listByUserId(7);

      expect(prisma.userConversation.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
        orderBy: { updatedAt: "desc" },
      });
    });

    it("rejeita userId inválido antes do Prisma", async () => {
      await expect(repository.listByUserId(-1)).rejects.toThrow(
        UserConversationValidationException,
      );

      expect(prisma.userConversation.findMany).not.toHaveBeenCalled();
    });
  });

  describe("updateTitle", () => {
    it("atualiza título quando conversa pertence ao usuário", async () => {
      const updatedRow = UserConversationRepositoryFixtures.prismaRow({
        title: "Filmes de ficção dos anos 90",
        updatedAt: new Date("2026-04-04T00:00:00.000Z"),
      });
      vi.mocked(prisma.userConversation.updateMany).mockResolvedValue({
        count: 1,
      });
      vi.mocked(prisma.userConversation.findFirst).mockResolvedValue(
        updatedRow as never,
      );

      const result = await repository.updateTitle(
        7,
        12,
        "Filmes de ficção dos anos 90",
      );

      expect(prisma.userConversation.updateMany).toHaveBeenCalledWith({
        where: { id: 12, userId: 7 },
        data: { title: "Filmes de ficção dos anos 90" },
      });
      expect(prisma.userConversation.findFirst).toHaveBeenCalledWith({
        where: { id: 12, userId: 7 },
      });
      expect(result).toEqual(
        UserConversationRepositoryFixtures.entityFromRow(updatedRow),
      );
    });

    it("retorna null quando conversa não pertence ao usuário", async () => {
      vi.mocked(prisma.userConversation.updateMany).mockResolvedValue({
        count: 0,
      });

      const result = await repository.updateTitle(99, 12, "Novo título");

      expect(prisma.userConversation.findFirst).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("rejeita título acima do limite", async () => {
      const longTitle = "a".repeat(201);

      await expect(repository.updateTitle(7, 12, longTitle)).rejects.toThrow(
        UserConversationValidationException,
      );

      expect(prisma.userConversation.updateMany).not.toHaveBeenCalled();
    });

    it("rejeita userId inválido antes do Prisma", async () => {
      await expect(repository.updateTitle(0, 12, "Novo título")).rejects.toThrow(
        UserConversationValidationException,
      );

      expect(prisma.userConversation.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("deleteById", () => {
    it("retorna true quando remove linha do usuário", async () => {
      vi.mocked(prisma.userConversation.deleteMany).mockResolvedValue({
        count: 1,
      });

      const result = await repository.deleteById(7, 12);

      expect(prisma.userConversation.deleteMany).toHaveBeenCalledWith({
        where: { id: 12, userId: 7 },
      });
      expect(result).toBe(true);
    });

    it("retorna false quando não encontra linha", async () => {
      vi.mocked(prisma.userConversation.deleteMany).mockResolvedValue({
        count: 0,
      });

      const result = await repository.deleteById(99, 12);

      expect(result).toBe(false);
    });

    it("rejeita userId inválido antes do Prisma", async () => {
      await expect(repository.deleteById(0, 12)).rejects.toThrow(
        UserConversationValidationException,
      );

      expect(prisma.userConversation.deleteMany).not.toHaveBeenCalled();
    });
  });
});
