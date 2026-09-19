import { describe, expect, it } from "vitest";
import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { GetGroupChatResult } from "@/modules/social/application/use-cases/get-group-chat.use-case";
import type { GroupChatEntity } from "@/modules/social/domain/entities/group-chat.entity";
import { GroupChatsResponseMapper } from "../group-chats-response.mapper";

class GroupChatsResponseMapperFixtures {
  static groupChat(overrides: Partial<GroupChatEntity> = {}): GroupChatEntity {
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

describe("GroupChatsResponseMapper", () => {
  it("toGroupChatSummaryResponse serializa datas em ISO string", () => {
    const entity = GroupChatsResponseMapperFixtures.groupChat();

    const response = GroupChatsResponseMapper.toGroupChatSummaryResponse(entity);

    expect(response).toEqual({
      id: 40,
      groupId: 3,
      chatId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Sábado",
      filterMemberUserIds: [7, 12, 15],
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-02T12:00:00.000Z",
    });
  });

  it("REQ-1: toCreateResponse preserva title null e filterMemberUserIds default", () => {
    const entity = GroupChatsResponseMapperFixtures.groupChat({
      title: null,
      filterMemberUserIds: [7],
    });

    const response = GroupChatsResponseMapper.toCreateResponse(entity);

    expect(response.title).toBeNull();
    expect(response.filterMemberUserIds).toEqual([7]);
    expect(response.chatId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("toListResponse mapeia cada chat como summary", () => {
    const entities = [
      GroupChatsResponseMapperFixtures.groupChat({ id: 40 }),
      GroupChatsResponseMapperFixtures.groupChat({
        id: 41,
        title: "Domingo",
      }),
    ];

    const response = GroupChatsResponseMapper.toListResponse(entities);

    expect(response).toHaveLength(2);
    expect(response[0]?.id).toBe(40);
    expect(response[1]?.title).toBe("Domingo");
    expect(response[0]?.createdAt).toBe("2026-03-01T10:00:00.000Z");
  });

  it("REQ-2: toGetResponse inclui messages do checkpointer", () => {
    const chat = GroupChatsResponseMapperFixtures.groupChat();
    const messages: ChatHistoryEntity = [
      ["user", "comédia leve"],
      ["ai", "Aqui vão sugestões"],
    ];
    const result: GetGroupChatResult = { chat, messages };

    const response = GroupChatsResponseMapper.toGetResponse(result);

    expect(response).toEqual({
      id: 40,
      groupId: 3,
      chatId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Sábado",
      filterMemberUserIds: [7, 12, 15],
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-02T12:00:00.000Z",
      messages,
    });
  });

  it("REQ-3: toUpdateTitleResponse reflete título atualizado", () => {
    const entity = GroupChatsResponseMapperFixtures.groupChat({
      title: "Terror leve",
    });

    const response = GroupChatsResponseMapper.toUpdateTitleResponse(entity);

    expect(response.title).toBe("Terror leve");
    expect(response.id).toBe(40);
  });

  it("REQ-4: toUpdateFilterMembersResponse reflete filterMemberUserIds atualizado", () => {
    const entity = GroupChatsResponseMapperFixtures.groupChat({
      filterMemberUserIds: [7, 12],
    });

    const response =
      GroupChatsResponseMapper.toUpdateFilterMembersResponse(entity);

    expect(response.filterMemberUserIds).toEqual([7, 12]);
  });
});
