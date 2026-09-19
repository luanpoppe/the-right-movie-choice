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

describe("GroupChatListUtils.formatDisplayTitle", () => {
  const updatedAt = "2026-03-15T12:00:00.000Z";

  it("REQ-9: delega título customizado para ConversationTitleUtils", () => {
    const displayTitle = GroupChatListUtils.formatDisplayTitle(
      "  Terror leve  ",
      updatedAt,
    );

    const expectedTitle = ConversationTitleUtils.formatDisplayTitle(
      "  Terror leve  ",
      updatedAt,
    );

    expect(displayTitle).toBe(expectedTitle);
    expect(displayTitle).toBe("Terror leve");
  });

  it("REQ-9: delega título null para label padrão com tempo relativo", () => {
    const displayTitle = GroupChatListUtils.formatDisplayTitle(null, updatedAt);

    const expectedTitle = ConversationTitleUtils.formatDisplayTitle(
      null,
      updatedAt,
    );

    expect(displayTitle).toBe(expectedTitle);
    expect(displayTitle).toMatch(/^New Conversation · .+/);
  });

  it("edge: título vazio ou só espaços usa label padrão com tempo relativo", () => {
    const emptyTitle = GroupChatListUtils.formatDisplayTitle("", updatedAt);
    const whitespaceTitle = GroupChatListUtils.formatDisplayTitle(
      "   ",
      updatedAt,
    );

    expect(emptyTitle).toMatch(/^New Conversation · .+/);
    expect(whitespaceTitle).toMatch(/^New Conversation · .+/);
  });
});
