import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserPublicEntity } from "../../../domain/entities/friend-request.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { SuggestGroupFriendsUseCase } from "../suggest-group-friends.use-case";

describe("SuggestGroupFriendsUseCase", () => {
  const userId = 7;
  const groupId = 3;
  const friendId = 12;
  const existingMemberId = 20;

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

  const acceptedFriends: UserPublicEntity[] = [
    { id: friendId, name: "Maria", email: "maria@example.com" },
    { id: existingMemberId, name: "Pedro", email: "pedro@example.com" },
    { id: userId, name: "João", email: "joao@example.com" },
  ];

  let userGroupRepository: IUserGroupRepository;
  let friendRequestRepository: IFriendRequestRepository;
  let useCase: SuggestGroupFriendsUseCase;

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
      findMemberUserIds: vi
        .fn()
        .mockResolvedValue([userId, existingMemberId]),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    friendRequestRepository = {
      findById: vi.fn(),
      findLatestBetweenUsers: vi.fn(),
      createPending: vi.fn(),
      executeSendFriendRequest: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      deleteAllBetweenUsers: vi.fn(),
      listAcceptedFriends: vi.fn().mockResolvedValue(acceptedFriends),
      listIncomingPending: vi.fn(),
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn(),
    };

    useCase = new SuggestGroupFriendsUseCase(
      userGroupRepository,
      friendRequestRepository,
    );
  });

  it("REQ-11: inclui amigos fora do grupo e exclui self e membros existentes", async () => {
    const result = await useCase.execute(userId, groupId);

    expect(friendRequestRepository.listAcceptedFriends).toHaveBeenCalledWith(
      userId,
    );
    expect(userGroupRepository.findMemberUserIds).toHaveBeenCalledWith(groupId);
    expect(result).toEqual([
      { id: friendId, name: "Maria", email: "maria@example.com" },
    ]);
    expect(result.some((friend) => friend.id === userId)).toBe(false);
    expect(result.some((friend) => friend.id === existingMemberId)).toBe(
      false,
    );
  });

  it("edge: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(useCase.execute(99, groupId)).rejects.toThrow(
      NotGroupMemberException,
    );
    expect(friendRequestRepository.listAcceptedFriends).not.toHaveBeenCalled();
  });

  it("edge: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, groupId)).rejects.toThrow(
      UserGroupNotFoundException,
    );
    expect(friendRequestRepository.listAcceptedFriends).not.toHaveBeenCalled();
  });
});
