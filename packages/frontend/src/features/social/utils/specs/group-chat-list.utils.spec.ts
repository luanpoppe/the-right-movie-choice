import { ConversationTitleUtils } from "@/features/conversations/utils/conversation-title.utils";
import type { GroupChatSummaryResponse } from "../../dto/group-chats.dto";
import { GroupChatListUtils } from "../group-chat-list.utils";

function buildGroupChatSummary(
  overrides: Partial<GroupChatSummaryResponse> = {},
): GroupChatSummaryResponse {
  return {
    id: 1,
    groupId: 3,
    chatId: "550e8400-e29b-41d4-a716-446655440000",
    title: null,
    filterMemberUserIds: [],
    createdAt: "2026-03-10T10:00:00.000Z",
    updatedAt: "2026-03-10T10:00:00.000Z",
    ...overrides,
  };
}

describe("GroupChatListUtils.sortByUpdatedAtDesc", () => {
  it("REQ-2: ordena chats por updatedAt descendente", () => {
    const olderChat = buildGroupChatSummary({
      id: 1,
      updatedAt: "2026-03-10T10:00:00.000Z",
    });
    const newerChat = buildGroupChatSummary({
      id: 2,
      updatedAt: "2026-03-15T12:00:00.000Z",
    });
    const middleChat = buildGroupChatSummary({
      id: 3,
      updatedAt: "2026-03-12T08:00:00.000Z",
    });

    const unsortedChats = [olderChat, newerChat, middleChat];
    const sortedChats = GroupChatListUtils.sortByUpdatedAtDesc(unsortedChats);

    expect(sortedChats.map((chat) => chat.id)).toEqual([2, 3, 1]);
  });

  it("não muta o array original", () => {
    const olderChat = buildGroupChatSummary({
      id: 1,
      updatedAt: "2026-03-10T10:00:00.000Z",
    });
    const newerChat = buildGroupChatSummary({
      id: 2,
      updatedAt: "2026-03-15T12:00:00.000Z",
    });

    const originalChats = [olderChat, newerChat];
    const originalOrder = originalChats.map((chat) => chat.id);

    GroupChatListUtils.sortByUpdatedAtDesc(originalChats);

    expect(originalChats.map((chat) => chat.id)).toEqual(originalOrder);
  });

  it("edge: array vazio retorna array vazio", () => {
    const sortedChats = GroupChatListUtils.sortByUpdatedAtDesc([]);

    expect(sortedChats).toEqual([]);
  });
});

describe("GroupChatListUtils.formatTitle", () => {
  it("REQ-9: título customizado é trimado", () => {
    const title = GroupChatListUtils.formatTitle("  Terror leve  ");

    expect(title).toBe("Terror leve");
  });

  it("REQ-9: título null usa o label padrão", () => {
    const title = GroupChatListUtils.formatTitle(null);

    expect(title).toBe(ConversationTitleUtils.NULL_TITLE_LABEL);
  });

  it("edge: título vazio ou só espaços usa o label padrão", () => {
    const emptyTitle = GroupChatListUtils.formatTitle("");
    const whitespaceTitle = GroupChatListUtils.formatTitle("   ");

    expect(emptyTitle).toBe(ConversationTitleUtils.NULL_TITLE_LABEL);
    expect(whitespaceTitle).toBe(ConversationTitleUtils.NULL_TITLE_LABEL);
  });
});

describe("GroupChatListUtils.formatUpdatedAt", () => {
  it("delega para ConversationTitleUtils.formatUpdatedAt", () => {
    const updatedAt = "2026-03-15T12:00:00.000Z";

    const formatted = GroupChatListUtils.formatUpdatedAt(updatedAt);

    expect(formatted).toBe(ConversationTitleUtils.formatUpdatedAt(updatedAt));
    expect(formatted.length).toBeGreaterThan(0);
  });
});
