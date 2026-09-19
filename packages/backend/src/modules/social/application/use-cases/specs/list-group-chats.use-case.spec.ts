import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupChatEntity } from "../../../domain/entities/group-chat.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import { UserGroupValidationException } from "../../../domain/exceptions/user-group-validation.exception";
import type { IGroupChatRepository } from "../../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { ListGroupChatsUseCase } from "../list-group-chats.use-case";

describe("ListGroupChatsUseCase", () => {
  const userId = 7;
  const groupId = 3;

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

  const chats: GroupChatEntity[] = [
    {
      id: 2,
      groupId,
      chatId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      title: "Mais recente",
      filterMemberUserIds: [7, 12],
      createdAt: new Date("2026-03-02T10:00:00.000Z"),
      updatedAt: new Date("2026-03-03T10:00:00.000Z"),
    },
    {
      id: 1,
      groupId,
      chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      title: null,
      filterMemberUserIds: [7, 12, 15],
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-01T10:00:00.000Z"),
    },
  ];

  let userGroupRepository: IUserGroupRepository;
  let groupChatRepository: IGroupChatRepository;
  let useCase: ListGroupChatsUseCase;

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
      listByGroupId: vi.fn().mockResolvedValue(chats),
      updateTitle: vi.fn(),
      updateFilterMembers: vi.fn(),
      touchUpdatedAt: vi.fn(),
      deleteById: vi.fn(),
    };

    useCase = new ListGroupChatsUseCase(
      userGroupRepository,
      groupChatRepository,
    );
  });

  it("REQ-2: membro autenticado lista chats do grupo via listByGroupId", async () => {
    const result = await useCase.execute(userId, groupId);

    expect(userGroupRepository.findById).toHaveBeenCalledWith(groupId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      userId,
    );
    expect(groupChatRepository.listByGroupId).toHaveBeenCalledWith(groupId);
    expect(result).toEqual(chats);
    expect(result).toHaveLength(2);
  });

  it("REQ-2: ordenação por updatedAt desc é responsabilidade do repositório", async () => {
    const result = await useCase.execute(userId, groupId);

    const mostRecentChat = result[0];
    const olderChat = result[1];
    expect(mostRecentChat).toBeDefined();
    expect(olderChat).toBeDefined();

    const mostRecentUpdatedAt = mostRecentChat!.updatedAt.getTime();
    const olderUpdatedAt = olderChat!.updatedAt.getTime();
    expect(mostRecentUpdatedAt).toBeGreaterThan(olderUpdatedAt);
  });

  it("REQ-2: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(useCase.execute(99, groupId)).rejects.toThrow(
      NotGroupMemberException,
    );
    expect(groupChatRepository.listByGroupId).not.toHaveBeenCalled();
  });

  it("REQ-6: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, 999)).rejects.toThrow(
      UserGroupNotFoundException,
    );
    expect(userGroupRepository.findMembership).not.toHaveBeenCalled();
    expect(groupChatRepository.listByGroupId).not.toHaveBeenCalled();
  });

  it("edge: grupo sem chats retorna array vazio", async () => {
    vi.mocked(groupChatRepository.listByGroupId).mockResolvedValue([]);

    const result = await useCase.execute(userId, groupId);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("edge: rejeita groupId inválido", async () => {
    await expect(useCase.execute(userId, 0)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.findById).not.toHaveBeenCalled();
    expect(groupChatRepository.listByGroupId).not.toHaveBeenCalled();
  });

  it("edge: rejeita userId inválido", async () => {
    await expect(useCase.execute(-1, groupId)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.findById).not.toHaveBeenCalled();
    expect(groupChatRepository.listByGroupId).not.toHaveBeenCalled();
  });
});
