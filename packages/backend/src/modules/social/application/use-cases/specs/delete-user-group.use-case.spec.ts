import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotGroupOwnerException } from "../../../domain/exceptions/not-group-owner.exception";
import { UserGroupValidationException } from "../../../domain/exceptions/user-group-validation.exception";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { DeleteUserGroupUseCase } from "../delete-user-group.use-case";

describe("DeleteUserGroupUseCase", () => {
  const ownerId = 7;
  const groupId = 3;

  let userGroupRepository: IUserGroupRepository;
  let useCase: DeleteUserGroupUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userGroupRepository = {
      findById: vi.fn(),
      createWithOwner: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn().mockResolvedValue(undefined),
      listGroupsForUser: vi.fn(),
      findMembership: vi.fn(),
      isOwner: vi.fn().mockResolvedValue(true),
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

    useCase = new DeleteUserGroupUseCase(userGroupRepository);
  });

  it("REQ-10: dono exclui grupo", async () => {
    await useCase.execute(ownerId, groupId);

    expect(userGroupRepository.isOwner).toHaveBeenCalledWith(groupId, ownerId);
    expect(userGroupRepository.deleteGroup).toHaveBeenCalledWith(groupId);
  });

  it("edge: não-dono recebe NotGroupOwnerException", async () => {
    vi.mocked(userGroupRepository.isOwner).mockResolvedValue(false);

    await expect(useCase.execute(12, groupId)).rejects.toThrow(
      NotGroupOwnerException,
    );
    expect(userGroupRepository.deleteGroup).not.toHaveBeenCalled();
  });

  it("edge: rejeita groupId inválido", async () => {
    await expect(useCase.execute(ownerId, 0)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.deleteGroup).not.toHaveBeenCalled();
  });
});
