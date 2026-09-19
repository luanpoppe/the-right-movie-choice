import { describe, expect, it } from "vitest";
import { GroupChatPrismaMapper } from "../group-chat-prisma.mapper";

class GroupChatPrismaMapperFixtures {
  static prismaGroupChatRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 40,
      groupId: 3,
      chatId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Sábado",
      filterMemberUserIds: [7, 12, 15],
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-02T12:00:00.000Z"),
      ...overrides,
    };
  }
}

describe("GroupChatPrismaMapper", () => {
  describe("toEntity", () => {
    it("mapeia todos os campos da row Prisma para GroupChatEntity", () => {
      const row = GroupChatPrismaMapperFixtures.prismaGroupChatRow();

      const entity = GroupChatPrismaMapper.toEntity(row as never);

      expect(entity).toEqual({
        id: 40,
        groupId: 3,
        chatId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Sábado",
        filterMemberUserIds: [7, 12, 15],
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
        updatedAt: new Date("2026-03-02T12:00:00.000Z"),
      });
    });

    it("REQ-1: preserva title null e filterMemberUserIds do grupo", () => {
      const row = GroupChatPrismaMapperFixtures.prismaGroupChatRow({
        title: null,
        filterMemberUserIds: [7],
      });

      const entity = GroupChatPrismaMapper.toEntity(row as never);

      expect(entity.title).toBeNull();
      expect(entity.filterMemberUserIds).toEqual([7]);
    });

    it("preserva filterMemberUserIds com múltiplos membros", () => {
      const row = GroupChatPrismaMapperFixtures.prismaGroupChatRow({
        filterMemberUserIds: [7, 12],
      });

      const entity = GroupChatPrismaMapper.toEntity(row as never);

      expect(entity.filterMemberUserIds).toEqual([7, 12]);
    });
  });
});
