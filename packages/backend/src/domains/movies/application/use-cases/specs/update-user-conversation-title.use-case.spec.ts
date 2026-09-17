import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateUserConversationTitleUseCase } from "../update-user-conversation-title.use-case";
import type { UserConversationEntity } from "../../../domain/entities/user-conversation.entity";
import { UserConversationNotFoundException } from "../../../domain/exceptions/user-conversation-not-found.exception";
import { UserConversationValidationException } from "../../../domain/exceptions/user-conversation-validation.exception";
import type { IUserConversationRepository } from "../../../domain/repositories/user-conversation.repository";
import { UserConversationConstants } from "../../../domain/user-conversation.constants";

describe("UpdateUserConversationTitleUseCase", () => {
  const userId = 7;
  const conversationId = 12;
  const newTitle = "Filmes de ficção dos anos 90";

  const updatedConversation: UserConversationEntity = {
    id: conversationId,
    userId,
    chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    title: newTitle,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-03T10:00:00.000Z"),
  };

  let userConversationRepository: IUserConversationRepository;
  let useCase: UpdateUserConversationTitleUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userConversationRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByChatId: vi.fn(),
      listByUserId: vi.fn(),
      updateTitle: vi.fn().mockResolvedValue(updatedConversation),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn(),
    };

    useCase = new UpdateUserConversationTitleUseCase(
      userConversationRepository,
    );
  });

  it("should validate title and return updated conversation", async () => {
    const result = await useCase.execute(userId, conversationId, newTitle);

    expect(userConversationRepository.updateTitle).toHaveBeenCalledWith(
      userId,
      conversationId,
      newTitle,
    );
    expect(result).toEqual(updatedConversation);
    expect(result.title).toBe(newTitle);
    expect(result.updatedAt.getTime()).toBeGreaterThan(
      result.createdAt.getTime(),
    );
  });

  it("should throw UserConversationNotFoundException when conversation is not found for user", async () => {
    vi.mocked(userConversationRepository.updateTitle).mockResolvedValue(null);

    await expect(
      useCase.execute(userId, conversationId, newTitle),
    ).rejects.toThrow(UserConversationNotFoundException);
  });

  it("should throw UserConversationValidationException when title exceeds max length", async () => {
    const maxTitleLength = UserConversationConstants.MAX_TITLE_LENGTH;
    const longTitle = "a".repeat(maxTitleLength + 1);

    await expect(
      useCase.execute(userId, conversationId, longTitle),
    ).rejects.toThrow(UserConversationValidationException);
    expect(userConversationRepository.updateTitle).not.toHaveBeenCalled();
  });
});
