import { describe, expect, it } from "vitest";
import { UserConversationPrismaMapper } from "../user-conversation-prisma.mapper";

class UserConversationPrismaMapperFixtures {
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
}

describe("UserConversationPrismaMapper", () => {
  it("mapeia todos os campos da row Prisma para a entidade de domínio", () => {
    const row = UserConversationPrismaMapperFixtures.prismaRow({
      title: "Filmes de ficção dos anos 90",
    });

    const entity = UserConversationPrismaMapper.toEntity(row as never);

    expect(entity).toEqual({
      id: 12,
      userId: 7,
      chatId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
      title: "Filmes de ficção dos anos 90",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
  });

  it("preserva title null quando conversa foi criada sem título", () => {
    const row = UserConversationPrismaMapperFixtures.prismaRow({ title: null });

    const entity = UserConversationPrismaMapper.toEntity(row as never);

    expect(entity.title).toBeNull();
  });
});
