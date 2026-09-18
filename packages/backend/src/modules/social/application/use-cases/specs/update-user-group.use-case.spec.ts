import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { NotGroupOwnerException } from "../../../domain/exceptions/not-group-owner.exception";
import { UserGroupValidationException } from "../../../domain/exceptions/user-group-validation.exception";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { UpdateUserGroupUseCase } from "../update-user-group.use-case";

describe("UpdateUserGroupUseCase", () => {
  const ownerId = 7;
  const groupId = 3;

  const updatedGroup: UserGroupEntity = {
    id: groupId,
    name: "Domingo série",
    description: "Maratonas de TV",
    ownerId,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-05T12:00:00.000Z"),
  };

  let userGroupRepository: IUserGroupRepository;
  let useCase: UpdateUserGroupUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userGroupRepository = {
      findById: vi.fn(),
      createWithOwner: vi.fn(),
      updateGroup: vi.fn().mockResolvedValue(updatedGroup),
      deleteGroup: vi.fn(),
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
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    useCase = new UpdateUserGroupUseCase(userGroupRepository);
  });

  it("REQ-16: dono atualiza name e description", async () => {
    const patch = {
      name: "Domingo série",
      description: "Maratonas de TV",
    };

    const result = await useCase.execute(ownerId, groupId, patch);

    expect(userGroupRepository.isOwner).toHaveBeenCalledWith(groupId, ownerId);
    expect(userGroupRepository.updateGroup).toHaveBeenCalledWith(groupId, patch);
    expect(result.name).toBe("Domingo série");
    expect(result.description).toBe("Maratonas de TV");
    expect(result.ownerId).toBe(ownerId);
  });

  it("REQ-17: edição parcial altera só name e mantém description anterior", async () => {
    const partialGroup: UserGroupEntity = {
      ...updatedGroup,
      name: "Novo nome",
      description: "Filmes do fim de semana",
    };
    vi.mocked(userGroupRepository.updateGroup).mockResolvedValue(partialGroup);

    const result = await useCase.execute(ownerId, groupId, {
      name: "Novo nome",
    });

    expect(userGroupRepository.updateGroup).toHaveBeenCalledWith(groupId, {
      name: "Novo nome",
    });
    expect(result.name).toBe("Novo nome");
    expect(result.description).toBe("Filmes do fim de semana");
  });

  it("edge: rejeita patch vazio", async () => {
    await expect(useCase.execute(ownerId, groupId, {})).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.updateGroup).not.toHaveBeenCalled();
  });

  it("edge: rejeita name vazio no patch", async () => {
    await expect(
      useCase.execute(ownerId, groupId, { name: "   " }),
    ).rejects.toThrow(UserGroupValidationException);
    expect(userGroupRepository.updateGroup).not.toHaveBeenCalled();
  });

  it("edge: não-dono recebe NotGroupOwnerException", async () => {
    vi.mocked(userGroupRepository.isOwner).mockResolvedValue(false);

    await expect(
      useCase.execute(12, groupId, { name: "Tentativa" }),
    ).rejects.toThrow(NotGroupOwnerException);
    expect(userGroupRepository.updateGroup).not.toHaveBeenCalled();
  });
});
