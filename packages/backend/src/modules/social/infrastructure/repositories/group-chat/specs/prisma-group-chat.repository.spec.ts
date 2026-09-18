import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaUtil } from "@/shared/utils/prisma.util";
import { GroupChatValidationException } from "../../../../domain/exceptions/group-chat-validation.exception";
import { PrismaGroupChatRepository } from "../prisma-group-chat.repository";

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    groupChat: {
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

const VALID_CHAT_ID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

class GroupChatRepositoryFixtures {
  static prismaRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 12,
      groupId: 3,
      chatId: VALID_CHAT_ID,
      title: null,
      filterMemberUserIds: [7, 12],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }

  static entityFromRow(
    row: ReturnType<typeof GroupChatRepositoryFixtures.prismaRow>,
  ) {
    return {
      id: row.id,
      groupId: row.groupId,
      chatId: row.chatId,
      title: row.title,
      filterMemberUserIds: row.filterMemberUserIds,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

describe("PrismaGroupChatRepository", () => {
  let repository: PrismaGroupChatRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaGroupChatRepository();
  });

  describe("create", () => {
    it("cria chat de grupo com filterMemberUserIds", async () => {
      const row = GroupChatRepositoryFixtures.prismaRow();
      vi.mocked(prisma.groupChat.create).mockResolvedValue(row as never);

      const result = await repository.create({
        groupId: 3,
        chatId: VALID_CHAT_ID,
        filterMemberUserIds: [7, 12],
      });

      expect(prisma.groupChat.create).toHaveBeenCalledWith({
        data: {
          groupId: 3,
          chatId: VALID_CHAT_ID,
          title: null,
          filterMemberUserIds: [7, 12],
        },
      });
      expect(result).toEqual(GroupChatRepositoryFixtures.entityFromRow(row));
      expect(Logger.info).toHaveBeenCalledWith("Group chat created", {
        groupId: 3,
        chatId: VALID_CHAT_ID,
        groupChatId: 12,
      });
    });

    it("cria chat com título opcional válido", async () => {
      const row = GroupChatRepositoryFixtures.prismaRow({
        title: "Filmes de ficção dos anos 90",
      });
      vi.mocked(prisma.groupChat.create).mockResolvedValue(row as never);

      const result = await repository.create({
        groupId: 3,
        chatId: VALID_CHAT_ID,
        title: "Filmes de ficção dos anos 90",
        filterMemberUserIds: [7],
      });

      expect(prisma.groupChat.create).toHaveBeenCalledWith({
        data: {
          groupId: 3,
          chatId: VALID_CHAT_ID,
          title: "Filmes de ficção dos anos 90",
          filterMemberUserIds: [7],
        },
      });
      expect(result).toEqual(GroupChatRepositoryFixtures.entityFromRow(row));
    });

    it("rejeita chatId inválido antes do Prisma", async () => {
      await expect(
        repository.create({
          groupId: 3,
          chatId: "not-a-uuid",
          filterMemberUserIds: [7],
        }),
      ).rejects.toThrow(GroupChatValidationException);

      expect(prisma.groupChat.create).not.toHaveBeenCalled();
    });

    it("rejeita groupId inválido antes do Prisma", async () => {
      await expect(
        repository.create({
          groupId: 0,
          chatId: VALID_CHAT_ID,
          filterMemberUserIds: [7],
        }),
      ).rejects.toThrow(GroupChatValidationException);

      expect(prisma.groupChat.create).not.toHaveBeenCalled();
    });

    it("P2002 lança GroupChatValidationException sobre chatId duplicado", async () => {
      const prismaError = { code: PrismaUtil.UNIQUE_CONSTRAINT_CODE };
      vi.mocked(prisma.groupChat.create).mockRejectedValue(prismaError);

      await expect(
        repository.create({
          groupId: 3,
          chatId: VALID_CHAT_ID,
          filterMemberUserIds: [7],
        }),
      ).rejects.toThrow(GroupChatValidationException);
      await expect(
        repository.create({
          groupId: 3,
          chatId: VALID_CHAT_ID,
          filterMemberUserIds: [7],
        }),
      ).rejects.toThrow(`chatId already exists: ${VALID_CHAT_ID}`);
    });
  });

  describe("findById", () => {
    it("retorna entidade quando pertence ao grupo", async () => {
      const row = GroupChatRepositoryFixtures.prismaRow();
      vi.mocked(prisma.groupChat.findFirst).mockResolvedValue(row as never);

      const result = await repository.findById(3, 12);

      expect(prisma.groupChat.findFirst).toHaveBeenCalledWith({
        where: { id: 12, groupId: 3 },
      });
      expect(result).toEqual(GroupChatRepositoryFixtures.entityFromRow(row));
    });

    it("retorna null quando não encontra", async () => {
      vi.mocked(prisma.groupChat.findFirst).mockResolvedValue(null);

      const result = await repository.findById(3, 99);

      expect(result).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith("Group chat find by id miss", {
        groupId: 3,
        id: 99,
      });
    });

    it("escopa consulta por groupId mesmo com id existente em outro grupo", async () => {
      vi.mocked(prisma.groupChat.findFirst).mockResolvedValue(null);

      const result = await repository.findById(99, 12);

      expect(prisma.groupChat.findFirst).toHaveBeenCalledWith({
        where: { id: 12, groupId: 99 },
      });
      expect(result).toBeNull();
    });

    it("rejeita groupId inválido antes do Prisma", async () => {
      await expect(repository.findById(0, 12)).rejects.toThrow(
        GroupChatValidationException,
      );

      expect(prisma.groupChat.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("findByChatId", () => {
    it("filtra por groupId mesmo com chatId globalmente único", async () => {
      vi.mocked(prisma.groupChat.findFirst).mockResolvedValue(null);

      const result = await repository.findByChatId(99, VALID_CHAT_ID);

      expect(prisma.groupChat.findFirst).toHaveBeenCalledWith({
        where: { chatId: VALID_CHAT_ID, groupId: 99 },
      });
      expect(result).toBeNull();
    });

    it("retorna entidade quando chatId pertence ao grupo", async () => {
      const row = GroupChatRepositoryFixtures.prismaRow();
      vi.mocked(prisma.groupChat.findFirst).mockResolvedValue(row as never);

      const result = await repository.findByChatId(3, VALID_CHAT_ID);

      expect(result).toEqual(GroupChatRepositoryFixtures.entityFromRow(row));
      expect(Logger.debug).toHaveBeenCalledWith(
        "Group chat find by chatId hit",
        { groupId: 3, chatId: VALID_CHAT_ID },
      );
    });

    it("rejeita groupId inválido antes do Prisma", async () => {
      await expect(repository.findByChatId(0, VALID_CHAT_ID)).rejects.toThrow(
        GroupChatValidationException,
      );

      expect(prisma.groupChat.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("listByGroupId", () => {
    it("lista por updatedAt descendente", async () => {
      const rowA = GroupChatRepositoryFixtures.prismaRow({
        id: 1,
        updatedAt: new Date("2026-03-03T00:00:00.000Z"),
      });
      const rowB = GroupChatRepositoryFixtures.prismaRow({
        id: 2,
        updatedAt: new Date("2026-02-02T00:00:00.000Z"),
      });
      vi.mocked(prisma.groupChat.findMany).mockResolvedValue([
        rowA,
        rowB,
      ] as never);

      const result = await repository.listByGroupId(3);

      expect(prisma.groupChat.findMany).toHaveBeenCalledWith({
        where: { groupId: 3 },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toEqual([
        GroupChatRepositoryFixtures.entityFromRow(rowA),
        GroupChatRepositoryFixtures.entityFromRow(rowB),
      ]);
    });

    it("filtra apenas chats do groupId informado", async () => {
      vi.mocked(prisma.groupChat.findMany).mockResolvedValue([] as never);

      await repository.listByGroupId(3);

      expect(prisma.groupChat.findMany).toHaveBeenCalledWith({
        where: { groupId: 3 },
        orderBy: { updatedAt: "desc" },
      });
    });

    it("rejeita groupId inválido antes do Prisma", async () => {
      await expect(repository.listByGroupId(-1)).rejects.toThrow(
        GroupChatValidationException,
      );

      expect(prisma.groupChat.findMany).not.toHaveBeenCalled();
    });
  });

  describe("updateTitle", () => {
    it("atualiza título quando chat pertence ao grupo", async () => {
      const updatedRow = GroupChatRepositoryFixtures.prismaRow({
        title: "Filmes de ficção dos anos 90",
        updatedAt: new Date("2026-04-04T00:00:00.000Z"),
      });
      vi.mocked(prisma.groupChat.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.groupChat.findFirst).mockResolvedValue(
        updatedRow as never,
      );

      const result = await repository.updateTitle(
        3,
        12,
        "Filmes de ficção dos anos 90",
      );

      expect(prisma.groupChat.updateMany).toHaveBeenCalledWith({
        where: { id: 12, groupId: 3 },
        data: { title: "Filmes de ficção dos anos 90" },
      });
      expect(prisma.groupChat.findFirst).toHaveBeenCalledWith({
        where: { id: 12, groupId: 3 },
      });
      expect(result).toEqual(
        GroupChatRepositoryFixtures.entityFromRow(updatedRow),
      );
    });

    it("retorna null quando chat não pertence ao grupo", async () => {
      vi.mocked(prisma.groupChat.updateMany).mockResolvedValue({ count: 0 });

      const result = await repository.updateTitle(99, 12, "Novo título");

      expect(prisma.groupChat.findFirst).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("rejeita título acima do limite", async () => {
      const longTitle = "a".repeat(201);

      await expect(repository.updateTitle(3, 12, longTitle)).rejects.toThrow(
        GroupChatValidationException,
      );

      expect(prisma.groupChat.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("updateFilterMembers", () => {
    it("atualiza filterMemberUserIds quando chat pertence ao grupo", async () => {
      const updatedRow = GroupChatRepositoryFixtures.prismaRow({
        filterMemberUserIds: [7],
        updatedAt: new Date("2026-04-04T00:00:00.000Z"),
      });
      vi.mocked(prisma.groupChat.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.groupChat.findFirst).mockResolvedValue(
        updatedRow as never,
      );

      const result = await repository.updateFilterMembers(3, 12, [7]);

      expect(prisma.groupChat.updateMany).toHaveBeenCalledWith({
        where: { id: 12, groupId: 3 },
        data: { filterMemberUserIds: [7] },
      });
      expect(prisma.groupChat.findFirst).toHaveBeenCalledWith({
        where: { id: 12, groupId: 3 },
      });
      expect(result).toEqual(
        GroupChatRepositoryFixtures.entityFromRow(updatedRow),
      );
      expect(Logger.info).toHaveBeenCalledWith(
        "Group chat filter members updated",
        { groupId: 3, groupChatId: 12, memberCount: 1 },
      );
    });

    it("retorna null quando chat não pertence ao grupo", async () => {
      vi.mocked(prisma.groupChat.updateMany).mockResolvedValue({ count: 0 });

      const result = await repository.updateFilterMembers(99, 12, [7]);

      expect(prisma.groupChat.findFirst).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("rejeita ids duplicados antes do Prisma", async () => {
      await expect(
        repository.updateFilterMembers(3, 12, [7, 7]),
      ).rejects.toThrow(GroupChatValidationException);

      expect(prisma.groupChat.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("touchUpdatedAt", () => {
    it("atualiza updatedAt quando chat pertence ao grupo", async () => {
      const updatedRow = GroupChatRepositoryFixtures.prismaRow({
        updatedAt: new Date("2026-05-05T00:00:00.000Z"),
      });
      vi.mocked(prisma.groupChat.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.groupChat.findFirst).mockResolvedValue(
        updatedRow as never,
      );

      const result = await repository.touchUpdatedAt(3, VALID_CHAT_ID);

      expect(prisma.groupChat.updateMany).toHaveBeenCalledWith({
        where: { chatId: VALID_CHAT_ID, groupId: 3 },
        data: { updatedAt: expect.any(Date) },
      });
      expect(prisma.groupChat.findFirst).toHaveBeenCalledWith({
        where: { chatId: VALID_CHAT_ID, groupId: 3 },
      });
      expect(result).toEqual(
        GroupChatRepositoryFixtures.entityFromRow(updatedRow),
      );
      expect(Logger.info).toHaveBeenCalledWith("Group chat updatedAt touched", {
        groupId: 3,
        chatId: VALID_CHAT_ID,
        groupChatId: 12,
      });
    });

    it("retorna null quando chat não pertence ao grupo", async () => {
      vi.mocked(prisma.groupChat.updateMany).mockResolvedValue({ count: 0 });

      const result = await repository.touchUpdatedAt(99, VALID_CHAT_ID);

      expect(prisma.groupChat.findFirst).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith(
        "Group chat touch updatedAt miss",
        { groupId: 99, chatId: VALID_CHAT_ID },
      );
    });

    it("rejeita chatId inválido antes do Prisma", async () => {
      await expect(repository.touchUpdatedAt(3, "not-a-uuid")).rejects.toThrow(
        GroupChatValidationException,
      );

      expect(prisma.groupChat.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("deleteById", () => {
    it("retorna true quando remove linha do grupo", async () => {
      vi.mocked(prisma.groupChat.deleteMany).mockResolvedValue({ count: 1 });

      const result = await repository.deleteById(3, 12);

      expect(prisma.groupChat.deleteMany).toHaveBeenCalledWith({
        where: { id: 12, groupId: 3 },
      });
      expect(result).toBe(true);
      expect(Logger.info).toHaveBeenCalledWith("Group chat deleted", {
        groupId: 3,
        groupChatId: 12,
      });
    });

    it("retorna false quando não encontra linha", async () => {
      vi.mocked(prisma.groupChat.deleteMany).mockResolvedValue({ count: 0 });

      const result = await repository.deleteById(99, 12);

      expect(result).toBe(false);
    });

    it("rejeita groupId inválido antes do Prisma", async () => {
      await expect(repository.deleteById(0, 12)).rejects.toThrow(
        GroupChatValidationException,
      );

      expect(prisma.groupChat.deleteMany).not.toHaveBeenCalled();
    });
  });
});
