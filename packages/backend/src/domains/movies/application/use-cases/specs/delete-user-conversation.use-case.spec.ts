import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteUserConversationUseCase } from "../delete-user-conversation.use-case";
import type { UserConversationEntity } from "../../../domain/entities/user-conversation.entity";
import { UserConversationDeleteAfterPurgeFailedException } from "../../../domain/exceptions/user-conversation-delete-after-purge-failed.exception";
import { UserConversationNotFoundException } from "../../../domain/exceptions/user-conversation-not-found.exception";
import type { IChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";
import type { IUserConversationRepository } from "../../../domain/repositories/user-conversation.repository";

describe("DeleteUserConversationUseCase", () => {
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

  let userConversationRepository: IUserConversationRepository;
  let chatThreadRepository: IChatThreadRepository;
  let useCase: DeleteUserConversationUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userConversationRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockConversation),
      findByChatId: vi.fn(),
      listByUserId: vi.fn(),
      updateTitle: vi.fn(),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn().mockResolvedValue(true),
    };

    chatThreadRepository = {
      deleteThread: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new DeleteUserConversationUseCase(
      userConversationRepository,
      chatThreadRepository,
    );
  });

  it("should purge chat thread and delete conversation metadata", async () => {
    await useCase.execute(userId, conversationId);

    expect(userConversationRepository.findById).toHaveBeenCalledWith(
      userId,
      conversationId,
    );
    expect(chatThreadRepository.deleteThread).toHaveBeenCalledWith(chatId);
    expect(userConversationRepository.deleteById).toHaveBeenCalledWith(
      userId,
      conversationId,
    );
  });

  it("should throw UserConversationNotFoundException when conversation is not found before purge", async () => {
    vi.mocked(userConversationRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, conversationId)).rejects.toThrow(
      UserConversationNotFoundException,
    );
    expect(chatThreadRepository.deleteThread).not.toHaveBeenCalled();
    expect(userConversationRepository.deleteById).not.toHaveBeenCalled();
  });

  it("should propagate purge errors and not delete metadata when deleteThread fails", async () => {
    const purgeError = new Error("Checkpointer purge failed");
    vi.mocked(chatThreadRepository.deleteThread).mockRejectedValue(purgeError);

    await expect(useCase.execute(userId, conversationId)).rejects.toThrow(
      purgeError,
    );
    expect(userConversationRepository.deleteById).not.toHaveBeenCalled();
  });

  it("should throw UserConversationDeleteAfterPurgeFailedException when deleteById returns false after purge", async () => {
    vi.mocked(userConversationRepository.deleteById).mockResolvedValue(false);

    await expect(useCase.execute(userId, conversationId)).rejects.toThrow(
      UserConversationDeleteAfterPurgeFailedException,
    );
    expect(chatThreadRepository.deleteThread).toHaveBeenCalledWith(chatId);
  });
});
