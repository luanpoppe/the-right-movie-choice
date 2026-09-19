import { movieClient } from "@/lib/api/movie-client";
import { GroupChatsService } from "../group-chats.service";

jest.mock("@/lib/api/movie-client", () => ({
  movieClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedPost = jest.mocked(movieClient.post);
const mockedGet = jest.mocked(movieClient.get);
const mockedPatch = jest.mocked(movieClient.patch);
const mockedDelete = jest.mocked(movieClient.delete);

class GroupChatsServiceFixtures {
  static summary(overrides: Record<string, unknown> = {}) {
    return {
      id: 40,
      groupId: 3,
      chatId: "550e8400-e29b-41d4-a716-446655440000",
      title: null,
      filterMemberUserIds: [7, 12, 15],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      ...overrides,
    };
  }

  static recommendationResponse() {
    return {
      movies: [],
      response: "Aqui estão algumas sugestões.",
    };
  }
}

describe("GroupChatsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create chama POST /social/groups/:groupId/chats", async () => {
    const summary = GroupChatsServiceFixtures.summary();
    mockedPost.mockResolvedValue({ data: summary });

    const result = await GroupChatsService.create(3);

    expect(mockedPost).toHaveBeenCalledWith("/social/groups/3/chats", {});
    expect(result).toEqual(summary);
  });

  it("list chama GET /social/groups/:groupId/chats", async () => {
    const summary = GroupChatsServiceFixtures.summary();
    mockedGet.mockResolvedValue({ data: [summary] });

    const result = await GroupChatsService.list(3);

    expect(mockedGet).toHaveBeenCalledWith("/social/groups/3/chats");
    expect(result).toEqual([summary]);
  });

  it("getByChatId chama GET /social/groups/:groupId/chats/:chatId com messages", async () => {
    const summary = GroupChatsServiceFixtures.summary();
    const chatId = "550e8400-e29b-41d4-a716-446655440000";
    const payload = {
      ...summary,
      messages: [
        ["user", "comédia leve"],
        ["ai", "Aqui estão sugestões"],
      ],
    };
    mockedGet.mockResolvedValue({ data: payload });

    const result = await GroupChatsService.getByChatId(3, chatId);

    expect(mockedGet).toHaveBeenCalledWith(
      "/social/groups/3/chats/550e8400-e29b-41d4-a716-446655440000",
    );
    expect(result.messages).toEqual(payload.messages);
  });

  it("updateTitle envia PATCH com title", async () => {
    const summary = GroupChatsServiceFixtures.summary({
      title: "Terror leve",
    });
    mockedPatch.mockResolvedValue({ data: summary });

    const result = await GroupChatsService.updateTitle(3, 40, "Terror leve");

    expect(mockedPatch).toHaveBeenCalledWith("/social/groups/3/chats/40", {
      title: "Terror leve",
    });
    expect(result.title).toBe("Terror leve");
  });

  it("delete chama DELETE /social/groups/:groupId/chats/:id", async () => {
    mockedDelete.mockResolvedValue({ data: undefined });

    await GroupChatsService.delete(3, 40);

    expect(mockedDelete).toHaveBeenCalledWith("/social/groups/3/chats/40");
  });

  it("updateFilterMembers envia PATCH com userIds", async () => {
    const summary = GroupChatsServiceFixtures.summary({
      filterMemberUserIds: [7, 12],
    });
    mockedPatch.mockResolvedValue({ data: summary });

    const result = await GroupChatsService.updateFilterMembers(3, 40, [7, 12]);

    expect(mockedPatch).toHaveBeenCalledWith(
      "/social/groups/3/chats/40/filter-members",
      { userIds: [7, 12] },
    );
    expect(result.filterMemberUserIds).toEqual([7, 12]);
  });

  it("recommend chama POST /social/groups/:groupId/chats/:chatId/recommendation", async () => {
    const chatId = "550e8400-e29b-41d4-a716-446655440000";
    const recommendation = GroupChatsServiceFixtures.recommendationResponse();
    mockedPost.mockResolvedValue({ data: recommendation });

    const result = await GroupChatsService.recommend(3, chatId, "comédia leve");

    expect(mockedPost).toHaveBeenCalledWith(
      "/social/groups/3/chats/550e8400-e29b-41d4-a716-446655440000/recommendation",
      { query: "comédia leve" },
    );
    expect(result).toEqual(recommendation);
  });
});
