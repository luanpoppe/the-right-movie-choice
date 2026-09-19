import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IChatThreadRepository } from "@/domains/movies/domain/repositories/chat-thread.repository";
import type { GroupChatEntity } from "../../../domain/entities/group-chat.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { GroupChatDeleteAfterPurgeFailedException } from "../../../domain/exceptions/group-chat-delete-after-purge-failed.exception";
import { GroupChatNotFoundException } from "../../../domain/exceptions/group-chat-not-found.exception";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import type { IGroupChatRepository } from "../../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { DeleteGroupChatUseCase } from "../delete-group-chat.use-case";

describe("DeleteGroupChatUseCase", () => {
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

  let userGroupRepository: IUserGroupRepository;
  let groupChatRepository: IGroupChatRepository;
  let chatThreadRepository: IChatThreadRepository;
  let useCase: DeleteGroupChatUseCase;

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
      findById: vi.fn().mockResolvedValue(mockGroupChat),
      findByChatId: vi.fn(),
      listByGroupId: vi.fn(),
      updateTitle: vi.fn(),
      updateFilterMembers: vi.fn(),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn().mockResolvedValue(true),
    };

    chatThreadRepository = {
      deleteThread: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new DeleteGroupChatUseCase(
      userGroupRepository,
      groupChatRepository,
      chatThreadRepository,
    );
  });

  it("REQ-3: membro exclui chat — purge do thread antes de delete dos metadados", async () => {
    await useCase.execute(userId, groupId, groupChatId);

    expect(userGroupRepository.findById).toHaveBeenCalledWith(groupId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      userId,
    );
    expect(groupChatRepository.findById).toHaveBeenCalledWith(
      groupId,
      groupChatId,
    );
    expect(chatThreadRepository.deleteThread).toHaveBeenCalledWith(chatId);
    expect(groupChatRepository.deleteById).toHaveBeenCalledWith(
      groupId,
      groupChatId,
    );
  });

  it("REQ-3: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(useCase.execute(99, groupId, groupChatId)).rejects.toThrow(
      NotGroupMemberException,
    );
    expect(groupChatRepository.findById).not.toHaveBeenCalled();
    expect(chatThreadRepository.deleteThread).not.toHaveBeenCalled();
    expect(groupChatRepository.deleteById).not.toHaveBeenCalled();
  });

  it("REQ-6: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, 999, groupChatId)).rejects.toThrow(
      UserGroupNotFoundException,
    );
    expect(userGroupRepository.findMembership).not.toHaveBeenCalled();
    expect(groupChatRepository.findById).not.toHaveBeenCalled();
    expect(chatThreadRepository.deleteThread).not.toHaveBeenCalled();
    expect(groupChatRepository.deleteById).not.toHaveBeenCalled();
  });

  it("should throw GroupChatNotFoundException when chat is not found before purge", async () => {
    vi.mocked(groupChatRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, groupId, groupChatId)).rejects.toThrow(
      GroupChatNotFoundException,
    );
    expect(chatThreadRepository.deleteThread).not.toHaveBeenCalled();
    expect(groupChatRepository.deleteById).not.toHaveBeenCalled();
  });

  it("should propagate purge errors and not delete metadata when deleteThread fails", async () => {
    const purgeError = new Error("Checkpointer purge failed");
    vi.mocked(chatThreadRepository.deleteThread).mockRejectedValue(purgeError);

    await expect(useCase.execute(userId, groupId, groupChatId)).rejects.toThrow(
      purgeError,
    );
    expect(groupChatRepository.deleteById).not.toHaveBeenCalled();
  });

  it("should throw GroupChatDeleteAfterPurgeFailedException when deleteById returns false after purge", async () => {
    vi.mocked(groupChatRepository.deleteById).mockResolvedValue(false);

    await expect(useCase.execute(userId, groupId, groupChatId)).rejects.toThrow(
      GroupChatDeleteAfterPurgeFailedException,
    );
    expect(chatThreadRepository.deleteThread).toHaveBeenCalledWith(chatId);
    expect(groupChatRepository.deleteById).toHaveBeenCalledTimes(2);
  });

  it("should succeed when deleteById succeeds on retry after first failure", async () => {
    vi.mocked(groupChatRepository.deleteById)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await useCase.execute(userId, groupId, groupChatId);

    expect(groupChatRepository.deleteById).toHaveBeenCalledTimes(2);
    expect(groupChatRepository.deleteById).toHaveBeenNthCalledWith(
      1,
      groupId,
      groupChatId,
    );
    expect(groupChatRepository.deleteById).toHaveBeenNthCalledWith(
      2,
      groupId,
      groupChatId,
    );
  });
});
