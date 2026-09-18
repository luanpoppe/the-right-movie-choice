import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserGroupListItemEntity } from "../../../domain/entities/user-group.entity";
import { UserGroupValidationException } from "../../../domain/exceptions/user-group-validation.exception";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { ListUserGroupsUseCase } from "../list-user-groups.use-case";

describe("ListUserGroupsUseCase", () => {
  const userId = 7;

  const groups: UserGroupListItemEntity[] = [
    {
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 7,
      memberCount: 2,
      joinedAt: new Date("2026-03-01T10:00:00.000Z"),
    },
    {
      id: 8,
      name: "Domingo série",
      ownerId: 12,
      memberCount: 5,
      joinedAt: new Date("2026-03-02T10:00:00.000Z"),
    },
  ];

  let userGroupRepository: IUserGroupRepository;
  let useCase: ListUserGroupsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userGroupRepository = {
      findById: vi.fn(),
      createWithOwner: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      listGroupsForUser: vi.fn().mockResolvedValue(groups),
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

    useCase = new ListUserGroupsUseCase(userGroupRepository);
  });

  it("REQ-2: retorna somente grupos em que o usuário é membro", async () => {
    const result = await useCase.execute(userId);

    expect(userGroupRepository.listGroupsForUser).toHaveBeenCalledWith(userId);
    expect(result).toEqual(groups);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(3);
    expect(result[1]?.id).toBe(8);
  });

  it("REQ-2: retorna array vazio quando usuário não participa de grupos", async () => {
    vi.mocked(userGroupRepository.listGroupsForUser).mockResolvedValue([]);

    const result = await useCase.execute(userId);

    expect(result).toEqual([]);
  });

  it("edge: rejeita userId inválido", async () => {
    await expect(useCase.execute(-1)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.listGroupsForUser).not.toHaveBeenCalled();
  });
});
