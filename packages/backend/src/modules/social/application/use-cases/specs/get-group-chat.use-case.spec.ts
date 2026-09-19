import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { IChatHistoryRepository } from "@/core/repositories/chat-history.repository";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import type { GroupChatEntity } from "../../../domain/entities/group-chat.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { GroupChatNotFoundException } from "../../../domain/exceptions/group-chat-not-found.exception";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import type { IGroupChatRepository } from "../../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { GetGroupChatUseCase } from "../get-group-chat.use-case";

vi.mock(
  "@/infrastructure/repositories/chat-history-catalog-enrichment.utils",
  () => ({
    ChatHistoryCatalogEnrichmentUtils: {
      enrichMoviePosters: vi.fn(async (history: ChatHistoryEntity) => history),
    },
  }),
);

describe("GetGroupChatUseCase", () => {
  const userId = 7;
  const groupId = 3;
  const groupChatId = 40;
  const chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  const group: UserGroupEntity = {
    id: groupId,
    name: "Sábado cinema",
    ownerId: userId,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const membership: GroupMemberEntity = {
    groupId,
    userId,
    joinedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const mockGroupChat: GroupChatEntity = {
    id: groupChatId,
    groupId,
    chatId,
    title: "Filmes de ficção",
    filterMemberUserIds: [7, 12],
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const mockMessages: ChatHistoryEntity = [
    ["user", "Quero filmes de ficção dos anos 90"],
    ["ai", "Recomendo Blade Runner e Matrix"],
  ];

  let userGroupRepository: IUserGroupRepository;
  let groupChatRepository: IGroupChatRepository;
  let chatHistoryRepository: IChatHistoryRepository;
  let catalogRepository: IMovieCatalogRepository;
  let useCase: GetGroupChatUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userGroupRepository = {
      findById: vi.fn().mockResolvedValue(group),
      createWithOwner: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      listGroupsForUser: vi.fn(),
      findMembership: vi.fn().mockResolvedValue(membership),
      isOwner: vi.fn(),
      countMembers: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn(),
      transferOwnership: vi.fn(),
      findOldestMemberAfterOwner: vi.fn(),
      deleteGroupAndRelated: vi.fn(),
      findMemberUserIds: vi.fn(),
      findMemberProfiles: vi.fn(),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    groupChatRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByChatId: vi.fn().mockResolvedValue(mockGroupChat),
      listByGroupId: vi.fn(),
      updateTitle: vi.fn(),
      updateFilterMembers: vi.fn(),
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

    useCase = new GetGroupChatUseCase(
      userGroupRepository,
      groupChatRepository,
      chatHistoryRepository,
      catalogRepository,
    );
  });

  it("REQ-2: membro obtém metadados e messages do checkpointer via chatId UUID", async () => {
    const result = await useCase.execute(userId, groupId, chatId);

    expect(userGroupRepository.findById).toHaveBeenCalledWith(groupId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      userId,
    );
    expect(groupChatRepository.findByChatId).toHaveBeenCalledWith(
      groupId,
      chatId,
    );
    expect(chatHistoryRepository.getHistory).toHaveBeenCalledWith(chatId);
    expect(result).toEqual({
      chat: mockGroupChat,
      messages: mockMessages,
    });
  });

  it("REQ-2: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(useCase.execute(99, groupId, chatId)).rejects.toThrow(
      NotGroupMemberException,
    );
    expect(groupChatRepository.findByChatId).not.toHaveBeenCalled();
    expect(chatHistoryRepository.getHistory).not.toHaveBeenCalled();
  });

  it("REQ-6: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, 999, chatId)).rejects.toThrow(
      UserGroupNotFoundException,
    );
    expect(userGroupRepository.findMembership).not.toHaveBeenCalled();
    expect(groupChatRepository.findByChatId).not.toHaveBeenCalled();
    expect(chatHistoryRepository.getHistory).not.toHaveBeenCalled();
  });

  it("should throw GroupChatNotFoundException when chat is not found in group", async () => {
    vi.mocked(groupChatRepository.findByChatId).mockResolvedValue(null);

    await expect(useCase.execute(userId, groupId, chatId)).rejects.toThrow(
      GroupChatNotFoundException,
    );
    expect(chatHistoryRepository.getHistory).not.toHaveBeenCalled();
  });

  it("should propagate errors from chat history repository", async () => {
    const historyError = new Error("Checkpointer unavailable");
    vi.mocked(chatHistoryRepository.getHistory).mockRejectedValue(historyError);

    await expect(useCase.execute(userId, groupId, chatId)).rejects.toThrow(
      historyError,
    );
  });
});
