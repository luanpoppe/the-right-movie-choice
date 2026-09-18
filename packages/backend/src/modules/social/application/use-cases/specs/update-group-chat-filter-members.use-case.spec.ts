import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupChatEntity } from "../../../domain/entities/group-chat.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { GroupChatInvalidFilterMemberUserIdsException } from "../../../domain/exceptions/group-chat-invalid-filter-member-user-ids.exception";
import { GroupChatNotFoundException } from "../../../domain/exceptions/group-chat-not-found.exception";
import { GroupChatValidationException } from "../../../domain/exceptions/group-chat-validation.exception";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import type { IGroupChatRepository } from "../../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { UpdateGroupChatFilterMembersUseCase } from "../update-group-chat-filter-members.use-case";

describe("UpdateGroupChatFilterMembersUseCase", () => {
  const userId = 7;
  const groupId = 3;
  const groupChatId = 40;
  const chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const currentFilterMemberUserIds = [7, 12, 15];
  const requestedFilterMemberUserIds = [7, 12];
  const groupMemberUserIds = [7, 12, 15];

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

  const updatedChat: GroupChatEntity = {
    id: groupChatId,
    groupId,
    chatId,
    title: "Comédia leve",
    filterMemberUserIds: requestedFilterMemberUserIds,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-03T10:00:00.000Z"),
  };

  let userGroupRepository: IUserGroupRepository;
  let groupChatRepository: IGroupChatRepository;
  let useCase: UpdateGroupChatFilterMembersUseCase;

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
      findMemberUserIds: vi.fn().mockResolvedValue(groupMemberUserIds),
      findMemberProfiles: vi.fn(),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    groupChatRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByChatId: vi.fn(),
      listByGroupId: vi.fn(),
      updateTitle: vi.fn(),
      updateFilterMembers: vi.fn().mockResolvedValue(updatedChat),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn(),
    };

    useCase = new UpdateGroupChatFilterMembersUseCase(
      userGroupRepository,
      groupChatRepository,
    );
  });

  it("REQ-4: membro atualiza filterMemberUserIds via id numérico do chat", async () => {
    const result = await useCase.execute(
      userId,
      groupId,
      groupChatId,
      requestedFilterMemberUserIds,
    );

    expect(userGroupRepository.findById).toHaveBeenCalledWith(groupId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      userId,
    );
    expect(userGroupRepository.findMemberUserIds).toHaveBeenCalledWith(groupId);
    expect(groupChatRepository.updateFilterMembers).toHaveBeenCalledWith(
      groupId,
      groupChatId,
      requestedFilterMemberUserIds,
    );
    expect(result).toEqual(updatedChat);
    expect(result.filterMemberUserIds).toEqual(requestedFilterMemberUserIds);
    expect(result.filterMemberUserIds).not.toEqual(currentFilterMemberUserIds);
  });

  it("REQ-4: userIds com id não membro do grupo lança 400 com lista de ids inválidos", async () => {
    const userIdsWithInvalidMember = [7, 12, 99];

    const rejection = await useCase
      .execute(userId, groupId, groupChatId, userIdsWithInvalidMember)
      .catch((error: unknown) => error);

    expect(rejection).toBeInstanceOf(
      GroupChatInvalidFilterMemberUserIdsException,
    );
    expect(rejection).toMatchObject({
      invalidUserIds: [99],
      statusCode: 400,
    });
    expect(groupChatRepository.updateFilterMembers).not.toHaveBeenCalled();
  });

  it("REQ-6: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(
      useCase.execute(99, groupId, groupChatId, requestedFilterMemberUserIds),
    ).rejects.toThrow(NotGroupMemberException);
    expect(userGroupRepository.findMemberUserIds).not.toHaveBeenCalled();
    expect(groupChatRepository.updateFilterMembers).not.toHaveBeenCalled();
  });

  it("REQ-6: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(userId, 999, groupChatId, requestedFilterMemberUserIds),
    ).rejects.toThrow(UserGroupNotFoundException);
    expect(userGroupRepository.findMembership).not.toHaveBeenCalled();
    expect(userGroupRepository.findMemberUserIds).not.toHaveBeenCalled();
    expect(groupChatRepository.updateFilterMembers).not.toHaveBeenCalled();
  });

  it("should throw GroupChatNotFoundException when chat is not found for group", async () => {
    vi.mocked(groupChatRepository.updateFilterMembers).mockResolvedValue(null);

    await expect(
      useCase.execute(userId, groupId, groupChatId, requestedFilterMemberUserIds),
    ).rejects.toThrow(GroupChatNotFoundException);
  });

  it("should throw GroupChatValidationException when filterMemberUserIds has duplicate ids", async () => {
    const duplicateUserIds = [7, 7];

    await expect(
      useCase.execute(userId, groupId, groupChatId, duplicateUserIds),
    ).rejects.toThrow(GroupChatValidationException);
    expect(userGroupRepository.findMemberUserIds).not.toHaveBeenCalled();
    expect(groupChatRepository.updateFilterMembers).not.toHaveBeenCalled();
  });

  it("should throw GroupChatValidationException when filterMemberUserIds has non-positive ids", async () => {
    const nonPositiveUserIds = [7, 0];

    await expect(
      useCase.execute(userId, groupId, groupChatId, nonPositiveUserIds),
    ).rejects.toThrow(GroupChatValidationException);
    expect(userGroupRepository.findMemberUserIds).not.toHaveBeenCalled();
    expect(groupChatRepository.updateFilterMembers).not.toHaveBeenCalled();
  });
});
