import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { NotGroupOwnerException } from "../../../domain/exceptions/not-group-owner.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { RemoveGroupMemberUseCase } from "../remove-group-member.use-case";

describe("RemoveGroupMemberUseCase", () => {
  const ownerId = 7;
  const groupId = 3;
  const targetMemberId = 15;

  const group: UserGroupEntity = {
    id: groupId,
    name: "Sábado cinema",
    ownerId,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const targetMembership: GroupMemberEntity = {
    groupId,
    userId: targetMemberId,
    joinedAt: new Date("2026-03-03T10:00:00.000Z"),
  };

  let userGroupRepository: IUserGroupRepository;
  let useCase: RemoveGroupMemberUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userGroupRepository = {
      findById: vi.fn().mockResolvedValue(group),
      createWithOwner: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      listGroupsForUser: vi.fn(),
      findMembership: vi.fn().mockResolvedValue(targetMembership),
      isOwner: vi.fn().mockResolvedValue(true),
      countMembers: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn().mockResolvedValue(undefined),
      transferOwnership: vi.fn(),
      findOldestMemberAfterOwner: vi.fn(),
      deleteGroupAndRelated: vi.fn(),
      findMemberUserIds: vi.fn(),
      findMemberProfiles: vi.fn(),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    useCase = new RemoveGroupMemberUseCase(userGroupRepository);
  });

  it("REQ-9: dono remove membro do grupo", async () => {
    await useCase.execute(ownerId, groupId, targetMemberId);

    expect(userGroupRepository.isOwner).toHaveBeenCalledWith(groupId, ownerId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      targetMemberId,
    );
    expect(userGroupRepository.removeMember).toHaveBeenCalledWith(
      groupId,
      targetMemberId,
    );
  });

  it("edge: não-dono recebe NotGroupOwnerException", async () => {
    vi.mocked(userGroupRepository.isOwner).mockResolvedValue(false);

    await expect(
      useCase.execute(12, groupId, targetMemberId),
    ).rejects.toThrow(NotGroupOwnerException);
    expect(userGroupRepository.removeMember).not.toHaveBeenCalled();
  });

  it("edge: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(ownerId, groupId, targetMemberId),
    ).rejects.toThrow(UserGroupNotFoundException);
    expect(userGroupRepository.removeMember).not.toHaveBeenCalled();
  });

  it("edge: alvo não é membro lança NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(
      useCase.execute(ownerId, groupId, targetMemberId),
    ).rejects.toThrow(NotGroupMemberException);
    expect(userGroupRepository.removeMember).not.toHaveBeenCalled();
  });

  it("edge: dono tenta remover a si mesmo lança NotGroupMemberException", async () => {
    await expect(
      useCase.execute(ownerId, groupId, ownerId),
    ).rejects.toThrow(NotGroupMemberException);
    expect(userGroupRepository.removeMember).not.toHaveBeenCalled();
  });
});
