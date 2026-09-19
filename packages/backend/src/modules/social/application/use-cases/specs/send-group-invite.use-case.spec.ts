import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserEntity } from "@/modules/users/domain/entities/user.entity";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { GroupInviteEntity } from "../../../domain/entities/group-invite.entity";
import { AlreadyGroupMemberException } from "../../../domain/exceptions/already-group-member.exception";
import { GroupFullException } from "../../../domain/exceptions/group-full.exception";
import { GroupInviteAlreadyPendingException } from "../../../domain/exceptions/group-invite-already-pending.exception";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { SelfGroupInviteException } from "../../../domain/exceptions/self-group-invite.exception";
import { UserNotFoundByEmailException } from "../../../domain/exceptions/user-not-found-by-email.exception";
import type { IGroupInviteRepository } from "../../../domain/repositories/group-invite.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import { MAX_GROUP_MEMBERS } from "../../../domain/utils/user-group-validation.utils";
import { SendGroupInviteUseCase } from "../send-group-invite.use-case";

describe("SendGroupInviteUseCase", () => {
  const inviterId = 7;
  const groupId = 3;
  const inviteeId = 12;
  const email = "Maria@Example.com";

  const inviterMembership: GroupMemberEntity = {
    groupId,
    userId: inviterId,
    joinedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const inviteeUser: UserEntity = {
    id: inviteeId,
    email: "maria@example.com",
    name: "Maria",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const pendingInvite: GroupInviteEntity = {
    id: 40,
    groupId,
    inviterId,
    inviteeId,
    status: "pending",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let groupInviteRepository: IGroupInviteRepository;
  let userGroupRepository: IUserGroupRepository;
  let userRepository: IUserRepository;
  let useCase: SendGroupInviteUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    groupInviteRepository = {
      findById: vi.fn(),
      findLatestPending: vi.fn(),
      createPending: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      listIncomingPending: vi.fn(),
      hasPendingInvite: vi.fn(),
      acceptPendingAndAddMember: vi.fn(),
      createPendingIfAvailable: vi.fn().mockResolvedValue(pendingInvite),
    };

    userGroupRepository = {
      findById: vi.fn(),
      createWithOwner: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      listGroupsForUser: vi.fn(),
      findMembership: vi.fn().mockImplementation(async (_gId, userId) => {
        if (userId === inviterId) {
          return inviterMembership;
        }
        return null;
      }),
      isOwner: vi.fn(),
      countMembers: vi.fn().mockResolvedValue(5),
      addMember: vi.fn(),
      removeMember: vi.fn(),
      transferOwnership: vi.fn(),
      findOldestMemberAfterOwner: vi.fn(),
      deleteGroupAndRelated: vi.fn(),
      findMemberUserIds: vi.fn(),
      findMemberProfiles: vi.fn(),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByEmailCaseInsensitive: vi.fn().mockResolvedValue(inviteeUser),
      findByGoogleId: vi.fn(),
      findAuthByEmail: vi.fn(),
      create: vi.fn(),
      createWithGoogle: vi.fn(),
      linkGoogleAccount: vi.fn(),
      setPasswordHash: vi.fn(),
    };

    useCase = new SendGroupInviteUseCase(
      groupInviteRepository,
      userGroupRepository,
      userRepository,
    );
  });

  it("REQ-3: membro convida usuário existente por e-mail", async () => {
    const result = await useCase.execute(inviterId, groupId, email);

    expect(userRepository.findByEmailCaseInsensitive).toHaveBeenCalledWith(
      "maria@example.com",
    );
    expect(userGroupRepository.countMembers).toHaveBeenCalledWith(groupId);
    expect(groupInviteRepository.createPendingIfAvailable).toHaveBeenCalledWith(
      groupId,
      inviterId,
      inviteeId,
    );
    expect(result).toEqual(pendingInvite);
    expect(result.status).toBe("pending");
  });

  it("REQ-13: permite reenvio após convite rejected", async () => {
    const result = await useCase.execute(inviterId, groupId, email);

    expect(groupInviteRepository.createPendingIfAvailable).toHaveBeenCalled();
    expect(result.status).toBe("pending");
  });

  it("edge: e-mail inexistente lança UserNotFoundByEmailException", async () => {
    vi.mocked(userRepository.findByEmailCaseInsensitive).mockResolvedValue(null);

    await expect(useCase.execute(inviterId, groupId, email)).rejects.toThrow(
      UserNotFoundByEmailException,
    );
    expect(groupInviteRepository.createPendingIfAvailable).not.toHaveBeenCalled();
  });

  it("edge: auto-convite lança SelfGroupInviteException", async () => {
    vi.mocked(userRepository.findByEmailCaseInsensitive).mockResolvedValue({
      ...inviteeUser,
      id: inviterId,
    });

    await expect(useCase.execute(inviterId, groupId, email)).rejects.toThrow(
      SelfGroupInviteException,
    );
    expect(groupInviteRepository.createPendingIfAvailable).not.toHaveBeenCalled();
  });

  it("edge: membro existente lança AlreadyGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockImplementation(
      async (_gId, userId) => {
        if (userId === inviterId || userId === inviteeId) {
          return {
            groupId,
            userId,
            joinedAt: new Date("2026-03-01T10:00:00.000Z"),
          };
        }
        return null;
      },
    );

    await expect(useCase.execute(inviterId, groupId, email)).rejects.toThrow(
      AlreadyGroupMemberException,
    );
    expect(groupInviteRepository.createPendingIfAvailable).not.toHaveBeenCalled();
  });

  it("edge: convite pending duplicado lança GroupInviteAlreadyPendingException", async () => {
    vi.mocked(groupInviteRepository.createPendingIfAvailable).mockRejectedValue(
      new GroupInviteAlreadyPendingException(),
    );

    await expect(useCase.execute(inviterId, groupId, email)).rejects.toThrow(
      GroupInviteAlreadyPendingException,
    );
  });

  it("edge: não-membro tenta convidar lança NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(useCase.execute(inviterId, groupId, email)).rejects.toThrow(
      NotGroupMemberException,
    );
    expect(groupInviteRepository.createPendingIfAvailable).not.toHaveBeenCalled();
  });

  it("edge: grupo cheio lança GroupFullException", async () => {
    vi.mocked(userGroupRepository.countMembers).mockResolvedValue(
      MAX_GROUP_MEMBERS,
    );

    await expect(useCase.execute(inviterId, groupId, email)).rejects.toThrow(
      GroupFullException,
    );
    expect(groupInviteRepository.createPendingIfAvailable).not.toHaveBeenCalled();
  });
});
