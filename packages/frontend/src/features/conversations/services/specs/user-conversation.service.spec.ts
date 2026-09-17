import { movieClient } from "@/lib/api/movie-client";
import { UserConversationService } from "../user-conversation.service";

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

class UserConversationServiceFixtures {
  static summary(overrides: Record<string, unknown> = {}) {
    return {
      id: 12,
      chatId: "11111111-1111-4111-8111-111111111111",
      title: "Sci-fi picks",
      createdAt: "2026-03-15T12:00:00.000Z",
      updatedAt: "2026-03-15T12:30:00.000Z",
      ...overrides,
    };
  }
}

describe("UserConversationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create chama POST /movie/conversations", async () => {
    const summary = UserConversationServiceFixtures.summary({ title: null });
    mockedPost.mockResolvedValue({ data: summary });

    const result = await UserConversationService.create();

    expect(mockedPost).toHaveBeenCalledWith("/movie/conversations");
    expect(result).toEqual(summary);
  });

  it("listConversations chama GET /movie/conversations", async () => {
    const summary = UserConversationServiceFixtures.summary();
    mockedGet.mockResolvedValue({ data: [summary] });

    const result = await UserConversationService.listConversations();

    expect(mockedGet).toHaveBeenCalledWith("/movie/conversations");
    expect(result).toEqual([summary]);
  });

  it("getById chama GET /movie/conversations/:id com messages", async () => {
    const summary = UserConversationServiceFixtures.summary();
    const payload = {
      ...summary,
      messages: [
        ["user", "Hello"],
        ["ai", "Hi"],
      ],
    };
    mockedGet.mockResolvedValue({ data: payload });

    const result = await UserConversationService.getById(12);

    expect(mockedGet).toHaveBeenCalledWith("/movie/conversations/12");
    expect(result.messages).toEqual(payload.messages);
  });

  it("updateTitle envia PATCH com title", async () => {
    const summary = UserConversationServiceFixtures.summary({
      title: "Renamed",
    });
    mockedPatch.mockResolvedValue({ data: summary });

    const result = await UserConversationService.updateTitle(12, "Renamed");

    expect(mockedPatch).toHaveBeenCalledWith("/movie/conversations/12", {
      title: "Renamed",
    });
    expect(result.title).toBe("Renamed");
  });

  it("delete chama DELETE /movie/conversations/:id", async () => {
    mockedDelete.mockResolvedValue({ data: undefined });

    await UserConversationService.delete(12);

    expect(mockedDelete).toHaveBeenCalledWith("/movie/conversations/12");
  });
});
