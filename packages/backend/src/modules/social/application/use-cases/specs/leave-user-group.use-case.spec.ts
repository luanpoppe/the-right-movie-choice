import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { LeaveUserGroupUseCase } from "../leave-user-group.use-case";

describe("LeaveUserGroupUseCase", () => {
  const groupId = 3;
  const ownerId = 7;
  const memberId = 12;

  const group: UserGroupEntity = {
    id: groupId,
    name: "Sábado cinema",
    ownerId,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const memberMembership: GroupMemberEntity = {
    groupId,
    userId: memberId,
    joinedAt: new Date("2026-03-02T10:00:00.000Z"),
  };

  const ownerMembership: GroupMemberEntity = {
    groupId,
    userId: ownerId,
    joinedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let userGroupRepository: IUserGroupRepository;
  let useCase: LeaveUserGroupUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userGroupRepository = {
      findById: vi.fn().mockResolvedValue(group),
      createWithOwner: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      listGroupsForUser: vi.fn(),
      findMembership: vi.fn(),
      isOwner: vi.fn(),
      countMembers: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn().mockResolvedValue(undefined),
      transferOwnership: vi.fn(),
      findOldestMemberAfterOwner: vi.fn(),
      deleteGroupAndRelated: vi.fn().mockResolvedValue(undefined),
      findMemberUserIds: vi.fn(),
      findMemberProfiles: vi.fn(),
      leaveAsOwnerWithTransfer: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new LeaveUserGroupUseCase(userGroupRepository);
  });

  it("REQ-7: membro não-dono sai do grupo", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(
      memberMembership,
    );
    vi.mocked(userGroupRepository.isOwner).mockResolvedValue(false);

    await useCase.execute(memberId, groupId);

    expect(userGroupRepository.removeMember).toHaveBeenCalledWith(
      groupId,
      memberId,
    );
    expect(userGroupRepository.leaveAsOwnerWithTransfer).not.toHaveBeenCalled();
    expect(userGroupRepository.deleteGroupAndRelated).not.toHaveBeenCalled();
  });

  it("REQ-8: dono sai e transfere ownership via método transacional", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(
      ownerMembership,
    );
    vi.mocked(userGroupRepository.isOwner).mockResolvedValue(true);
    vi.mocked(userGroupRepository.countMembers).mockResolvedValue(3);

    await useCase.execute(ownerId, groupId);

    expect(userGroupRepository.leaveAsOwnerWithTransfer).toHaveBeenCalledWith(
      groupId,
      ownerId,
    );
    expect(userGroupRepository.transferOwnership).not.toHaveBeenCalled();
    expect(userGroupRepository.removeMember).not.toHaveBeenCalled();
    expect(userGroupRepository.deleteGroupAndRelated).not.toHaveBeenCalled();
  });

  it("edge: dono único dissolve o grupo", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(
      ownerMembership,
    );
    vi.mocked(userGroupRepository.isOwner).mockResolvedValue(true);
    vi.mocked(userGroupRepository.countMembers).mockResolvedValue(1);

    await useCase.execute(ownerId, groupId);

    expect(userGroupRepository.deleteGroupAndRelated).toHaveBeenCalledWith(
      groupId,
    );
    expect(userGroupRepository.leaveAsOwnerWithTransfer).not.toHaveBeenCalled();
    expect(userGroupRepository.removeMember).not.toHaveBeenCalled();
  });

  it("edge: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(memberId, groupId)).rejects.toThrow(
      UserGroupNotFoundException,
    );
    expect(userGroupRepository.removeMember).not.toHaveBeenCalled();
  });

  it("edge: não-membro lança NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(useCase.execute(99, groupId)).rejects.toThrow(
      NotGroupMemberException,
    );
    expect(userGroupRepository.removeMember).not.toHaveBeenCalled();
  });
});
