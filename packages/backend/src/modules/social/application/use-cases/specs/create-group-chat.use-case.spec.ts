import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupChatEntity } from "../../../domain/entities/group-chat.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { MAX_TITLE_LENGTH } from "../../../domain/group-chat-validation.utils";
import { GroupChatValidationException } from "../../../domain/exceptions/group-chat-validation.exception";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import { UserGroupValidationException } from "../../../domain/exceptions/user-group-validation.exception";
import type { IGroupChatRepository } from "../../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { CreateGroupChatUseCase } from "../create-group-chat.use-case";

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
}));

describe("CreateGroupChatUseCase", () => {
  const userId = 7;
  const groupId = 3;
  const chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const memberUserIds = [7, 12, 15];

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
    id: 1,
    groupId,
    chatId,
    title: null,
    filterMemberUserIds: memberUserIds,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let userGroupRepository: IUserGroupRepository;
  let groupChatRepository: IGroupChatRepository;
  let useCase: CreateGroupChatUseCase;

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
      findMemberUserIds: vi.fn().mockResolvedValue(memberUserIds),
      findMemberProfiles: vi.fn(),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    groupChatRepository = {
      create: vi.fn().mockResolvedValue(mockGroupChat),
      findById: vi.fn(),
      findByChatId: vi.fn(),
      listByGroupId: vi.fn(),
      updateTitle: vi.fn(),
      updateFilterMembers: vi.fn(),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn(),
    };

    useCase = new CreateGroupChatUseCase(
      userGroupRepository,
      groupChatRepository,
    );
  });

  it("REQ-1: membro cria chat com chatId UUID gerado no servidor e filterMemberUserIds de todos os membros", async () => {
    const result = await useCase.execute(userId, groupId);

    expect(userGroupRepository.findById).toHaveBeenCalledWith(groupId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      userId,
    );
    expect(userGroupRepository.findMemberUserIds).toHaveBeenCalledWith(groupId);
    expect(groupChatRepository.create).toHaveBeenCalledWith({
      groupId,
      chatId,
      title: null,
      filterMemberUserIds: memberUserIds,
    });
    expect(result).toEqual(mockGroupChat);
    expect(result.chatId).toBe(chatId);
    expect(result.filterMemberUserIds).toEqual(memberUserIds);
  });

  it("REQ-1: title opcional — cria com title null quando omitido", async () => {
    const result = await useCase.execute(userId, groupId);

    expect(groupChatRepository.create).toHaveBeenCalledWith({
      groupId,
      chatId,
      title: null,
      filterMemberUserIds: memberUserIds,
    });
    expect(result.title).toBeNull();
  });

  it("REQ-1: title opcional — cria com title informado", async () => {
    const title = "Filmes de terror";
    const chatWithTitle: GroupChatEntity = {
      ...mockGroupChat,
      title,
    };
    vi.mocked(groupChatRepository.create).mockResolvedValue(chatWithTitle);

    const result = await useCase.execute(userId, groupId, title);

    expect(groupChatRepository.create).toHaveBeenCalledWith({
      groupId,
      chatId,
      title,
      filterMemberUserIds: memberUserIds,
    });
    expect(result.title).toBe(title);
  });

  it("REQ-1: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(useCase.execute(99, groupId)).rejects.toThrow(
      NotGroupMemberException,
    );
    expect(userGroupRepository.findMemberUserIds).not.toHaveBeenCalled();
    expect(groupChatRepository.create).not.toHaveBeenCalled();
  });

  it("REQ-6: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, 999)).rejects.toThrow(
      UserGroupNotFoundException,
    );
    expect(userGroupRepository.findMembership).not.toHaveBeenCalled();
    expect(userGroupRepository.findMemberUserIds).not.toHaveBeenCalled();
    expect(groupChatRepository.create).not.toHaveBeenCalled();
  });

  it("edge: rejeita groupId inválido", async () => {
    await expect(useCase.execute(userId, 0)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.findById).not.toHaveBeenCalled();
    expect(groupChatRepository.create).not.toHaveBeenCalled();
  });

  it("edge: rejeita userId inválido", async () => {
    await expect(useCase.execute(-1, groupId)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.findById).not.toHaveBeenCalled();
    expect(groupChatRepository.create).not.toHaveBeenCalled();
  });

  it("edge: rejeita title acima do limite", async () => {
    const longTitle = "a".repeat(MAX_TITLE_LENGTH + 1);

    await expect(useCase.execute(userId, groupId, longTitle)).rejects.toThrow(
      GroupChatValidationException,
    );
    expect(userGroupRepository.findMemberUserIds).not.toHaveBeenCalled();
    expect(groupChatRepository.create).not.toHaveBeenCalled();
  });
});
