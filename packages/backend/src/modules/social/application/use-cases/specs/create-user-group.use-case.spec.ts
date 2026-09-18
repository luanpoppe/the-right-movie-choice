import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { UserGroupValidationException } from "../../../domain/exceptions/user-group-validation.exception";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { CreateUserGroupUseCase } from "../create-user-group.use-case";

describe("CreateUserGroupUseCase", () => {
  const ownerId = 7;
  const name = "Sábado cinema";
  const description = "Filmes do fim de semana";

  const createdGroup: UserGroupEntity = {
    id: 3,
    name,
    description,
    ownerId,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let userGroupRepository: IUserGroupRepository;
  let useCase: CreateUserGroupUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userGroupRepository = {
      findById: vi.fn(),
      createWithOwner: vi.fn().mockResolvedValue(createdGroup),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      listGroupsForUser: vi.fn(),
      findMembership: vi.fn(),
      isOwner: vi.fn(),
      countMembers: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn(),
      transferOwnership: vi.fn(),
      findOldestMemberAfterOwner: vi.fn(),
      deleteGroupAndRelated: vi.fn(),
      findMemberUserIds: vi.fn(),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    useCase = new CreateUserGroupUseCase(userGroupRepository);
  });

  it("REQ-1: cria grupo com dono e retorna entidade", async () => {
    const result = await useCase.execute(ownerId, name, description);

    expect(userGroupRepository.createWithOwner).toHaveBeenCalledWith(
      ownerId,
      name,
      description,
    );
    expect(result).toEqual(createdGroup);
    expect(result.ownerId).toBe(ownerId);
  });

  it("REQ-1: aceita description omitida", async () => {
    const { description: _description, ...groupWithoutDescription } =
      createdGroup;
    vi.mocked(userGroupRepository.createWithOwner).mockResolvedValue(
      groupWithoutDescription,
    );

    const result = await useCase.execute(ownerId, name);

    expect(userGroupRepository.createWithOwner).toHaveBeenCalledWith(
      ownerId,
      name,
      undefined,
    );
    expect(result.description).toBeUndefined();
  });

  it("edge: rejeita ownerId inválido", async () => {
    await expect(useCase.execute(0, name)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.createWithOwner).not.toHaveBeenCalled();
  });

  it("edge: rejeita name vazio", async () => {
    await expect(useCase.execute(ownerId, "   ")).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.createWithOwner).not.toHaveBeenCalled();
  });

  it("edge: rejeita description acima do limite", async () => {
    const longDescription = "x".repeat(501);

    await expect(
      useCase.execute(ownerId, name, longDescription),
    ).rejects.toThrow(UserGroupValidationException);
    expect(userGroupRepository.createWithOwner).not.toHaveBeenCalled();
  });
});
