import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserPublicEntity } from "../../../domain/entities/friend-request.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import { UserGroupValidationException } from "../../../domain/exceptions/user-group-validation.exception";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { ListGroupMembersUseCase } from "../list-group-members.use-case";

describe("ListGroupMembersUseCase", () => {
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

  const members: UserPublicEntity[] = [
    { id: 12, name: "Ana", email: "ana@example.com" },
    { id: 7, name: "João", email: "joao@example.com" },
    { id: 15, name: "Maria", email: "maria@example.com" },
  ];

  let userGroupRepository: IUserGroupRepository;
  let useCase: ListGroupMembersUseCase;

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
      findMemberProfiles: vi.fn().mockResolvedValue(members),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    useCase = new ListGroupMembersUseCase(userGroupRepository);
  });

  it("REQ-1: membro autenticado lista perfis com id, name e email", async () => {
    const result = await useCase.execute(userId, groupId);

    expect(userGroupRepository.findById).toHaveBeenCalledWith(groupId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      userId,
    );
    expect(userGroupRepository.findMemberProfiles).toHaveBeenCalledWith(
      groupId,
    );
    expect(result).toEqual(members);
    expect(result).toHaveLength(3);
    expect(result.every((member) => member.id && member.name && member.email)).toBe(
      true,
    );
  });

  it("REQ-4: retorna shape UserPublic para cada membro", async () => {
    const profiles: UserPublicEntity[] = [
      { id: 7, name: "João", email: "joao@example.com" },
      { id: 12, name: "Maria", email: "maria@example.com" },
    ];
    vi.mocked(userGroupRepository.findMemberProfiles).mockResolvedValue(
      profiles,
    );

    const result = await useCase.execute(userId, groupId);

    expect(result).toEqual(profiles);
    expect(result[0]).toEqual({
      id: 7,
      name: "João",
      email: "joao@example.com",
    });
    expect(result[1]).toEqual({
      id: 12,
      name: "Maria",
      email: "maria@example.com",
    });
  });

  it("REQ-2: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(useCase.execute(99, groupId)).rejects.toThrow(
      NotGroupMemberException,
    );
    expect(userGroupRepository.findMemberProfiles).not.toHaveBeenCalled();
  });

  it("REQ-5: grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId, 999)).rejects.toThrow(
      UserGroupNotFoundException,
    );
    expect(userGroupRepository.findMembership).not.toHaveBeenCalled();
    expect(userGroupRepository.findMemberProfiles).not.toHaveBeenCalled();
  });

  it("edge: grupo com um único membro retorna array de 1 item", async () => {
    const singleMember: UserPublicEntity[] = [
      { id: userId, name: "João", email: "joao@example.com" },
    ];
    vi.mocked(userGroupRepository.findMemberProfiles).mockResolvedValue(
      singleMember,
    );

    const result = await useCase.execute(userId, groupId);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(userId);
  });

  it("edge: grupo no limite de 100 membros retorna até 100 itens sem paginação", async () => {
    const hundredMembers: UserPublicEntity[] = Array.from(
      { length: 100 },
      (_, index) => ({
        id: index + 1,
        name: `Membro ${index + 1}`,
        email: `membro${index + 1}@example.com`,
      }),
    );
    vi.mocked(userGroupRepository.findMemberProfiles).mockResolvedValue(
      hundredMembers,
    );

    const result = await useCase.execute(userId, groupId);

    expect(result).toHaveLength(100);
  });

  it("edge: rejeita groupId inválido", async () => {
    await expect(useCase.execute(userId, 0)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.findById).not.toHaveBeenCalled();
  });

  it("edge: rejeita userId inválido", async () => {
    await expect(useCase.execute(-1, groupId)).rejects.toThrow(
      UserGroupValidationException,
    );
    expect(userGroupRepository.findById).not.toHaveBeenCalled();
  });
});
