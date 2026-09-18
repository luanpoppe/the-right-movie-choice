import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupChatEntity } from "../../../domain/entities/group-chat.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { GroupChatNotFoundException } from "../../../domain/exceptions/group-chat-not-found.exception";
import { GroupChatValidationException } from "../../../domain/exceptions/group-chat-validation.exception";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import { MAX_TITLE_LENGTH } from "../../../domain/group-chat-validation.utils";
import type { IGroupChatRepository } from "../../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { UpdateGroupChatTitleUseCase } from "../update-group-chat-title.use-case";

describe("UpdateGroupChatTitleUseCase", () => {
  const userId = 7;
  const groupId = 3;
  const groupChatId = 40;
  const newTitle = "Terror leve";
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

  const updatedChat: GroupChatEntity = {
    id: groupChatId,
    groupId,
    chatId,
    title: newTitle,
    filterMemberUserIds: [7, 12],
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-03T10:00:00.000Z"),
  };

  let userGroupRepository: IUserGroupRepository;
  let groupChatRepository: IGroupChatRepository;
  let useCase: UpdateGroupChatTitleUseCase;

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
      findByChatId: vi.fn(),
      listByGroupId: vi.fn(),
      updateTitle: vi.fn().mockResolvedValue(updatedChat),
      updateFilterMembers: vi.fn(),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn(),
    };

    useCase = new UpdateGroupChatTitleUseCase(
      userGroupRepository,
      groupChatRepository,
    );
  });

  it("REQ-3: membro atualiza título via id numérico do chat", async () => {
    const result = await useCase.execute(userId, groupId, groupChatId, newTitle);

    expect(userGroupRepository.findById).toHaveBeenCalledWith(groupId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      userId,
    );
    expect(groupChatRepository.updateTitle).toHaveBeenCalledWith(
      groupId,
      groupChatId,
      newTitle,
    );
    expect(result).toEqual(updatedChat);
    expect(result.title).toBe(newTitle);
  });

  it("REQ-3: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(
      useCase.execute(99, groupId, groupChatId, newTitle),
    ).rejects.toThrow(NotGroupMemberException);
    expect(groupChatRepository.updateTitle).not.toHaveBeenCalled();
  });

  it("REQ-6: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(userId, 999, groupChatId, newTitle),
    ).rejects.toThrow(UserGroupNotFoundException);
    expect(userGroupRepository.findMembership).not.toHaveBeenCalled();
    expect(groupChatRepository.updateTitle).not.toHaveBeenCalled();
  });

  it("should throw GroupChatNotFoundException when chat is not found for group", async () => {
    vi.mocked(groupChatRepository.updateTitle).mockResolvedValue(null);

    await expect(
      useCase.execute(userId, groupId, groupChatId, newTitle),
    ).rejects.toThrow(GroupChatNotFoundException);
  });

  it("should throw GroupChatValidationException when title exceeds max length", async () => {
    const longTitle = "a".repeat(MAX_TITLE_LENGTH + 1);

    await expect(
      useCase.execute(userId, groupId, groupChatId, longTitle),
    ).rejects.toThrow(GroupChatValidationException);
    expect(groupChatRepository.updateTitle).not.toHaveBeenCalled();
  });
});
