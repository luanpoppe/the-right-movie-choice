import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListUserConversationsUseCase } from "../list-user-conversations.use-case";
import type { UserConversationEntity } from "../../../domain/entities/user-conversation.entity";
import type { IUserConversationRepository } from "../../../domain/repositories/user-conversation.repository";

describe("ListUserConversationsUseCase", () => {
  const userId = 7;

  const conversationsOrderedByUpdatedAtDesc: UserConversationEntity[] = [
    {
      id: 2,
      userId,
      chatId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      title: "Mais recente",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-03T10:00:00.000Z"),
    },
    {
      id: 1,
      userId,
      chatId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      title: "Mais antiga",
      createdAt: new Date("2026-02-01T10:00:00.000Z"),
      updatedAt: new Date("2026-02-02T10:00:00.000Z"),
    },
  ];

  let userConversationRepository: IUserConversationRepository;
  let useCase: ListUserConversationsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userConversationRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByChatId: vi.fn(),
      listByUserId: vi
        .fn()
        .mockResolvedValue(conversationsOrderedByUpdatedAtDesc),
      updateTitle: vi.fn(),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn(),
    };

    useCase = new ListUserConversationsUseCase(userConversationRepository);
  });

  it("should list conversations for the given userId preserving repository order", async () => {
    const result = await useCase.execute(userId);

    expect(userConversationRepository.listByUserId).toHaveBeenCalledWith(userId);
    expect(result).toEqual(conversationsOrderedByUpdatedAtDesc);
    expect(result).toHaveLength(2);

    const mostRecentConversation = result[0];
    const olderConversation = result[1];
    expect(mostRecentConversation).toBeDefined();
    expect(olderConversation).toBeDefined();

    const mostRecentUpdatedAt = mostRecentConversation!.updatedAt.getTime();
    const olderUpdatedAt = olderConversation!.updatedAt.getTime();
    expect(mostRecentUpdatedAt).toBeGreaterThan(olderUpdatedAt);
  });

  it("should return empty array when user has no conversations", async () => {
    vi.mocked(userConversationRepository.listByUserId).mockResolvedValue([]);

    const result = await useCase.execute(userId);

    expect(userConversationRepository.listByUserId).toHaveBeenCalledWith(userId);
    expect(result).toEqual([]);
  });
});
