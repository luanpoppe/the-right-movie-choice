import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { IChatHistoryRepository } from "@/core/repositories/chat-history.repository";
import { GetUserConversationUseCase } from "../get-user-conversation.use-case";
import type { UserConversationEntity } from "../../../domain/entities/user-conversation.entity";
import { UserConversationNotFoundException } from "../../../domain/exceptions/user-conversation-not-found.exception";
import type { IMovieCatalogRepository } from "../../../domain/repositories/movie-catalog.repository";
import type { IUserConversationRepository } from "../../../domain/repositories/user-conversation.repository";

vi.mock(
  "@/infrastructure/repositories/chat-history-catalog-enrichment.utils",
  () => ({
    ChatHistoryCatalogEnrichmentUtils: {
      enrichMoviePosters: vi.fn(async (history: ChatHistoryEntity) => history),
    },
  }),
);

describe("GetUserConversationUseCase", () => {
  const userId = 7;
  const conversationId = 12;
  const chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  const mockConversation: UserConversationEntity = {
    id: conversationId,
    userId,
    chatId,
    title: "Filmes de ficção",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const mockMessages: ChatHistoryEntity = [
    ["user", "Quero filmes de ficção dos anos 90"],
    ["ai", "Recomendo Blade Runner e Matrix"],
  ];

  let userConversationRepository: IUserConversationRepository;
  let chatHistoryRepository: IChatHistoryRepository;
  let catalogRepository: IMovieCatalogRepository;
  let useCase: GetUserConversationUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userConversationRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockConversation),
      findByChatId: vi.fn(),
      listByUserId: vi.fn(),
      updateTitle: vi.fn(),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn(),
    };

    chatHistoryRepository = {
      getHistory: vi.fn().mockResolvedValue(mockMessages),
    };

    catalogRepository = {
      findByTmdbId: vi.fn(),
      findByTitleAndYear: vi.fn(),
      findByTitlesAndYears: vi.fn(),
      upsert: vi.fn(),
    };

    useCase = new GetUserConversationUseCase(
      userConversationRepository,
      chatHistoryRepository,
      catalogRepository,
    );
  });

  it("should return conversation metadata and messages from chat history", async () => {
    const result = await useCase.execute(userId, conversationId);

    expect(userConversationRepository.findById).toHaveBeenCalledWith(
      userId,
      conversationId,
    );
    expect(chatHistoryRepository.getHistory).toHaveBeenCalledWith(chatId);
    expect(result).toEqual({
      conversation: mockConversation,
      messages: mockMessages,
    });
  });

  it("should throw UserConversationNotFoundException when conversation is not found for user", async () => {
    vi.mocked(userConversationRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, conversationId)).rejects.toThrow(
      UserConversationNotFoundException,
    );
    expect(chatHistoryRepository.getHistory).not.toHaveBeenCalled();
  });

  it("should propagate errors from chat history repository", async () => {
    const historyError = new Error("Checkpointer unavailable");
    vi.mocked(chatHistoryRepository.getHistory).mockRejectedValue(historyError);

    await expect(useCase.execute(userId, conversationId)).rejects.toThrow(
      historyError,
    );
  });
});
