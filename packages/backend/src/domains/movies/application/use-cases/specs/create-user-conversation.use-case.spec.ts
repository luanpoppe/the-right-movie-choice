import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUserConversationUseCase } from "../create-user-conversation.use-case";
import type { UserConversationEntity } from "../../../domain/entities/user-conversation.entity";
import type { IUserConversationRepository } from "../../../domain/repositories/user-conversation.repository";

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
}));

describe("CreateUserConversationUseCase", () => {
  const userId = 7;
  const chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  const mockConversation: UserConversationEntity = {
    id: 12,
    userId,
    chatId,
    title: null,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let userConversationRepository: IUserConversationRepository;
  let useCase: CreateUserConversationUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userConversationRepository = {
      create: vi.fn().mockResolvedValue(mockConversation),
      findById: vi.fn(),
      findByChatId: vi.fn(),
      listByUserId: vi.fn(),
      updateTitle: vi.fn(),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn(),
    };

    useCase = new CreateUserConversationUseCase(userConversationRepository);
  });

  it("should generate server-side chatId and create conversation with title null", async () => {
    const result = await useCase.execute(userId);

    expect(userConversationRepository.create).toHaveBeenCalledWith({
      userId,
      chatId,
      title: null,
    });
    expect(result).toEqual(mockConversation);
    expect(result.id).toBe(12);
    expect(result.chatId).toBe(chatId);
    expect(result.title).toBeNull();
  });
});
