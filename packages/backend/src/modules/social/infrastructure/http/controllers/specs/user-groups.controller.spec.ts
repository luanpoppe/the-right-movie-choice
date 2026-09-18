import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import type { BaseException } from "@/core/exceptions/base.exception";
import type { GroupInviteEntity } from "@/modules/social/domain/entities/group-invite.entity";
import type {
  UserGroupEntity,
  UserGroupListItemEntity,
} from "@/modules/social/domain/entities/user-group.entity";
import { AlreadyGroupMemberException } from "@/modules/social/domain/exceptions/already-group-member.exception";
import { GroupFullException } from "@/modules/social/domain/exceptions/group-full.exception";
import { GroupInviteAlreadyPendingException } from "@/modules/social/domain/exceptions/group-invite-already-pending.exception";
import { GroupInviteNotFoundException } from "@/modules/social/domain/exceptions/group-invite-not-found.exception";
import { NotGroupMemberException } from "@/modules/social/domain/exceptions/not-group-member.exception";
import { NotGroupOwnerException } from "@/modules/social/domain/exceptions/not-group-owner.exception";
import { UserGroupNotFoundException } from "@/modules/social/domain/exceptions/user-group-not-found.exception";
import { UserGroupValidationException } from "@/modules/social/domain/exceptions/user-group-validation.exception";
import { UserNotFoundByEmailException } from "@/modules/social/domain/exceptions/user-not-found-by-email.exception";
import { AcceptGroupInviteUseCase } from "@/modules/social/application/use-cases/accept-group-invite.use-case";
import { CancelGroupInviteUseCase } from "@/modules/social/application/use-cases/cancel-group-invite.use-case";
import { CreateUserGroupUseCase } from "@/modules/social/application/use-cases/create-user-group.use-case";
import { DeleteUserGroupUseCase } from "@/modules/social/application/use-cases/delete-user-group.use-case";
import { LeaveUserGroupUseCase } from "@/modules/social/application/use-cases/leave-user-group.use-case";
import { ListGroupMembersUseCase } from "@/modules/social/application/use-cases/list-group-members.use-case";
import { ListIncomingGroupInvitesUseCase } from "@/modules/social/application/use-cases/list-incoming-group-invites.use-case";
import { ListUserGroupsUseCase } from "@/modules/social/application/use-cases/list-user-groups.use-case";
import { RejectGroupInviteUseCase } from "@/modules/social/application/use-cases/reject-group-invite.use-case";
import { RemoveGroupMemberUseCase } from "@/modules/social/application/use-cases/remove-group-member.use-case";
import { SendGroupInviteUseCase } from "@/modules/social/application/use-cases/send-group-invite.use-case";
import { SuggestGroupFriendsUseCase } from "@/modules/social/application/use-cases/suggest-group-friends.use-case";
import { UpdateUserGroupUseCase } from "@/modules/social/application/use-cases/update-user-group.use-case";
import type {
  CreateUserGroupDTO,
  GroupInviteIdParams,
  GroupMemberUserIdParams,
  SendGroupInviteDTO,
  UpdateUserGroupDTO,
  UserGroupIdParams,
} from "../../dto/user-groups.dto";
import { UserGroupsController } from "../user-groups.controller";

class UserGroupsControllerFixtures {
  static userGroup(overrides: Partial<UserGroupEntity> = {}): UserGroupEntity {
    return {
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 7,
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-01T10:00:00.000Z"),
      ...overrides,
    };
  }

  static groupInvite(
    overrides: Partial<GroupInviteEntity> = {},
  ): GroupInviteEntity {
    return {
      id: 40,
      groupId: 3,
      inviterId: 7,
      inviteeId: 12,
      status: "pending",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-01T10:00:00.000Z"),
      ...overrides,
    };
  }
}

function createReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

async function expectPropagatesWithStatusCode(
  handlerPromise: Promise<unknown>,
  ExceptionClass: new (...args: never[]) => BaseException,
  statusCode: number,
) {
  try {
    await handlerPromise;
    expect.fail("Expected handler to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(ExceptionClass);
    expect((error as BaseException).statusCode).toBe(statusCode);
  }
}

function createAuthRequest<T extends Record<string, unknown>>(
  request: T,
  userId = 7,
): T & { userMovieEntryAuth: { userId: number } } {
  return {
    ...request,
    userMovieEntryAuth: { userId },
  };
}

describe("UserGroupsController", () => {
  let createUserGroupUseCase: CreateUserGroupUseCase;
  let listUserGroupsUseCase: ListUserGroupsUseCase;
  let updateUserGroupUseCase: UpdateUserGroupUseCase;
  let deleteUserGroupUseCase: DeleteUserGroupUseCase;
  let sendGroupInviteUseCase: SendGroupInviteUseCase;
  let leaveUserGroupUseCase: LeaveUserGroupUseCase;
  let removeGroupMemberUseCase: RemoveGroupMemberUseCase;
  let listGroupMembersUseCase: ListGroupMembersUseCase;
  let suggestGroupFriendsUseCase: SuggestGroupFriendsUseCase;
  let acceptGroupInviteUseCase: AcceptGroupInviteUseCase;
  let rejectGroupInviteUseCase: RejectGroupInviteUseCase;
  let cancelGroupInviteUseCase: CancelGroupInviteUseCase;
  let listIncomingGroupInvitesUseCase: ListIncomingGroupInvitesUseCase;
  let handlers: ReturnType<typeof UserGroupsController.create>;

  beforeEach(() => {
    vi.clearAllMocks();

    createUserGroupUseCase = { execute: vi.fn() } as unknown as CreateUserGroupUseCase;
    listUserGroupsUseCase = { execute: vi.fn() } as unknown as ListUserGroupsUseCase;
    updateUserGroupUseCase = { execute: vi.fn() } as unknown as UpdateUserGroupUseCase;
    deleteUserGroupUseCase = { execute: vi.fn() } as unknown as DeleteUserGroupUseCase;
    sendGroupInviteUseCase = { execute: vi.fn() } as unknown as SendGroupInviteUseCase;
    leaveUserGroupUseCase = { execute: vi.fn() } as unknown as LeaveUserGroupUseCase;
    removeGroupMemberUseCase = { execute: vi.fn() } as unknown as RemoveGroupMemberUseCase;
    listGroupMembersUseCase = { execute: vi.fn() } as unknown as ListGroupMembersUseCase;
    suggestGroupFriendsUseCase = { execute: vi.fn() } as unknown as SuggestGroupFriendsUseCase;
    acceptGroupInviteUseCase = { execute: vi.fn() } as unknown as AcceptGroupInviteUseCase;
    rejectGroupInviteUseCase = { execute: vi.fn() } as unknown as RejectGroupInviteUseCase;
    cancelGroupInviteUseCase = { execute: vi.fn() } as unknown as CancelGroupInviteUseCase;
    listIncomingGroupInvitesUseCase = {
      execute: vi.fn(),
    } as unknown as ListIncomingGroupInvitesUseCase;

    handlers = UserGroupsController.create({
      createUserGroupUseCase,
      listUserGroupsUseCase,
      updateUserGroupUseCase,
      deleteUserGroupUseCase,
      sendGroupInviteUseCase,
      leaveUserGroupUseCase,
      removeGroupMemberUseCase,
      listGroupMembersUseCase,
      suggestGroupFriendsUseCase,
      acceptGroupInviteUseCase,
      rejectGroupInviteUseCase,
      cancelGroupInviteUseCase,
      listIncomingGroupInvitesUseCase,
    });
  });

  it("createUserGroup happy path returns 201", async () => {
    const group = UserGroupsControllerFixtures.userGroup();
    vi.mocked(createUserGroupUseCase.execute).mockResolvedValue(group);
    const request = createAuthRequest({
      body: { name: "Sábado cinema", description: "Filmes do fim de semana" },
    }) as unknown as FastifyRequest<{ Body: CreateUserGroupDTO }>;
    const reply = createReply();

    await handlers.createUserGroup(request, reply);

    expect(createUserGroupUseCase.execute).toHaveBeenCalledWith(
      7,
      "Sábado cinema",
      "Filmes do fim de semana",
    );
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 7,
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
    });
  });

  it("listUserGroups happy path returns 200", async () => {
    const groups: UserGroupListItemEntity[] = [
      {
        id: 3,
        name: "Sábado cinema",
        ownerId: 7,
        memberCount: 2,
        joinedAt: new Date("2026-03-01T10:00:00.000Z"),
      },
    ];
    vi.mocked(listUserGroupsUseCase.execute).mockResolvedValue(groups);
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.listUserGroups(request, reply);

    expect(listUserGroupsUseCase.execute).toHaveBeenCalledWith(7);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith([
      expect.objectContaining({ id: 3, memberCount: 2 }),
    ]);
  });

  it("updateUserGroup happy path returns 200", async () => {
    const group = UserGroupsControllerFixtures.userGroup({
      name: "Domingo série",
      description: "Maratonas de TV",
    });
    vi.mocked(updateUserGroupUseCase.execute).mockResolvedValue(group);
    const request = createAuthRequest({
      params: { id: "3" },
      body: { name: "Domingo série", description: "Maratonas de TV" },
    }) as unknown as FastifyRequest<{
      Params: UserGroupIdParams;
      Body: UpdateUserGroupDTO;
    }>;
    const reply = createReply();

    await handlers.updateUserGroup(request, reply);

    expect(updateUserGroupUseCase.execute).toHaveBeenCalledWith(7, 3, {
      name: "Domingo série",
      description: "Maratonas de TV",
    });
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it("deleteUserGroup happy path returns 204", async () => {
    vi.mocked(deleteUserGroupUseCase.execute).mockResolvedValue();
    const request = createAuthRequest({
      params: { id: "3" },
    }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
    const reply = createReply();

    await handlers.deleteUserGroup(request, reply);

    expect(deleteUserGroupUseCase.execute).toHaveBeenCalledWith(7, 3);
    expect(reply.status).toHaveBeenCalledWith(204);
  });

  it("sendGroupInvite happy path returns 201", async () => {
    const invite = UserGroupsControllerFixtures.groupInvite();
    vi.mocked(sendGroupInviteUseCase.execute).mockResolvedValue(invite);
    const request = createAuthRequest({
      params: { id: "3" },
      body: { email: "maria@example.com" },
    }) as unknown as FastifyRequest<{
      Params: UserGroupIdParams;
      Body: SendGroupInviteDTO;
    }>;
    const reply = createReply();

    await handlers.sendGroupInvite(request, reply);

    expect(sendGroupInviteUseCase.execute).toHaveBeenCalledWith(
      7,
      3,
      "maria@example.com",
    );
    expect(reply.status).toHaveBeenCalledWith(201);
  });

  it("leaveUserGroup happy path returns 204", async () => {
    vi.mocked(leaveUserGroupUseCase.execute).mockResolvedValue();
    const request = createAuthRequest({
      params: { id: "3" },
    }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
    const reply = createReply();

    await handlers.leaveUserGroup(request, reply);

    expect(leaveUserGroupUseCase.execute).toHaveBeenCalledWith(7, 3);
    expect(reply.status).toHaveBeenCalledWith(204);
  });

  it("removeGroupMember happy path returns 204", async () => {
    vi.mocked(removeGroupMemberUseCase.execute).mockResolvedValue();
    const request = createAuthRequest({
      params: { id: "3", userId: "15" },
    }) as unknown as FastifyRequest<{ Params: GroupMemberUserIdParams }>;
    const reply = createReply();

    await handlers.removeGroupMember(request, reply);

    expect(removeGroupMemberUseCase.execute).toHaveBeenCalledWith(7, 3, 15);
    expect(reply.status).toHaveBeenCalledWith(204);
  });

  it("listGroupMembers happy path returns 200", async () => {
    vi.mocked(listGroupMembersUseCase.execute).mockResolvedValue([
      { id: 7, name: "João", email: "joao@example.com" },
      { id: 12, name: "Maria", email: "maria@example.com" },
    ]);
    const request = createAuthRequest({
      params: { id: "3" },
    }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
    const reply = createReply();

    await handlers.listGroupMembers(request, reply);

    expect(listGroupMembersUseCase.execute).toHaveBeenCalledWith(7, 3);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith([
      { id: 7, name: "João", email: "joao@example.com" },
      { id: 12, name: "Maria", email: "maria@example.com" },
    ]);
  });

  it("suggestGroupFriends happy path returns 200", async () => {
    vi.mocked(suggestGroupFriendsUseCase.execute).mockResolvedValue([
      { id: 12, name: "Maria", email: "maria@example.com" },
    ]);
    const request = createAuthRequest({
      params: { id: "3" },
    }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
    const reply = createReply();

    await handlers.suggestGroupFriends(request, reply);

    expect(suggestGroupFriendsUseCase.execute).toHaveBeenCalledWith(7, 3);
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it("acceptGroupInvite happy path returns 200 with accepted status", async () => {
    const invite = UserGroupsControllerFixtures.groupInvite({
      status: "accepted",
    });
    vi.mocked(acceptGroupInviteUseCase.execute).mockResolvedValue(invite);
    const request = createAuthRequest(
      { params: { id: "40" } },
      12,
    ) as unknown as FastifyRequest<{ Params: GroupInviteIdParams }>;
    const reply = createReply();

    await handlers.acceptGroupInvite(request, reply);

    expect(acceptGroupInviteUseCase.execute).toHaveBeenCalledWith(12, 40);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" }),
    );
  });

  it("rejectGroupInvite happy path returns 200 with rejected status", async () => {
    const invite = UserGroupsControllerFixtures.groupInvite({
      status: "rejected",
    });
    vi.mocked(rejectGroupInviteUseCase.execute).mockResolvedValue(invite);
    const request = createAuthRequest(
      { params: { id: "40" } },
      12,
    ) as unknown as FastifyRequest<{ Params: GroupInviteIdParams }>;
    const reply = createReply();

    await handlers.rejectGroupInvite(request, reply);

    expect(rejectGroupInviteUseCase.execute).toHaveBeenCalledWith(12, 40);
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it("cancelGroupInvite happy path returns 204", async () => {
    vi.mocked(cancelGroupInviteUseCase.execute).mockResolvedValue();
    const request = createAuthRequest({
      params: { id: "41" },
    }) as unknown as FastifyRequest<{ Params: GroupInviteIdParams }>;
    const reply = createReply();

    await handlers.cancelGroupInvite(request, reply);

    expect(cancelGroupInviteUseCase.execute).toHaveBeenCalledWith(7, 41);
    expect(reply.status).toHaveBeenCalledWith(204);
  });

  it("listIncomingGroupInvites happy path returns 200", async () => {
    vi.mocked(listIncomingGroupInvitesUseCase.execute).mockResolvedValue([
      {
        id: 40,
        group: { id: 3, name: "Sábado cinema" },
        inviter: { id: 7, name: "João", email: "joao@example.com" },
        status: "pending",
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
      },
    ]);
    const request = createAuthRequest({}, 12) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.listIncomingGroupInvites(request, reply);

    expect(listIncomingGroupInvitesUseCase.execute).toHaveBeenCalledWith(12);
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it("acceptGroupInvite propagates GroupInviteNotFoundException with statusCode 404", async () => {
    const notFoundError = new GroupInviteNotFoundException(40);
    vi.mocked(acceptGroupInviteUseCase.execute).mockRejectedValue(notFoundError);
    const request = createAuthRequest(
      { params: { id: "40" } },
      12,
    ) as unknown as FastifyRequest<{ Params: GroupInviteIdParams }>;
    const reply = createReply();

    await expectPropagatesWithStatusCode(
      handlers.acceptGroupInvite(request, reply),
      GroupInviteNotFoundException,
      404,
    );
  });

  describe("error propagation with HTTP status codes", () => {
    it("sendGroupInvite propagates GroupFullException with statusCode 409", async () => {
      vi.mocked(sendGroupInviteUseCase.execute).mockRejectedValue(
        new GroupFullException(),
      );
      const request = createAuthRequest({
        params: { id: "3" },
        body: { email: "maria@example.com" },
      }) as unknown as FastifyRequest<{
        Params: UserGroupIdParams;
        Body: SendGroupInviteDTO;
      }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.sendGroupInvite(request, reply),
        GroupFullException,
        409,
      );
    });

    it("sendGroupInvite propagates NotGroupMemberException with statusCode 404", async () => {
      vi.mocked(sendGroupInviteUseCase.execute).mockRejectedValue(
        new NotGroupMemberException(3),
      );
      const request = createAuthRequest({
        params: { id: "3" },
        body: { email: "maria@example.com" },
      }) as unknown as FastifyRequest<{
        Params: UserGroupIdParams;
        Body: SendGroupInviteDTO;
      }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.sendGroupInvite(request, reply),
        NotGroupMemberException,
        404,
      );
    });

    it("sendGroupInvite propagates GroupInviteAlreadyPendingException with statusCode 409", async () => {
      vi.mocked(sendGroupInviteUseCase.execute).mockRejectedValue(
        new GroupInviteAlreadyPendingException(),
      );
      const request = createAuthRequest({
        params: { id: "3" },
        body: { email: "maria@example.com" },
      }) as unknown as FastifyRequest<{
        Params: UserGroupIdParams;
        Body: SendGroupInviteDTO;
      }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.sendGroupInvite(request, reply),
        GroupInviteAlreadyPendingException,
        409,
      );
    });

    it("sendGroupInvite propagates AlreadyGroupMemberException with statusCode 409", async () => {
      vi.mocked(sendGroupInviteUseCase.execute).mockRejectedValue(
        new AlreadyGroupMemberException(),
      );
      const request = createAuthRequest({
        params: { id: "3" },
        body: { email: "maria@example.com" },
      }) as unknown as FastifyRequest<{
        Params: UserGroupIdParams;
        Body: SendGroupInviteDTO;
      }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.sendGroupInvite(request, reply),
        AlreadyGroupMemberException,
        409,
      );
    });

    it("sendGroupInvite propagates UserNotFoundByEmailException with statusCode 404", async () => {
      vi.mocked(sendGroupInviteUseCase.execute).mockRejectedValue(
        new UserNotFoundByEmailException("maria@example.com"),
      );
      const request = createAuthRequest({
        params: { id: "3" },
        body: { email: "maria@example.com" },
      }) as unknown as FastifyRequest<{
        Params: UserGroupIdParams;
        Body: SendGroupInviteDTO;
      }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.sendGroupInvite(request, reply),
        UserNotFoundByEmailException,
        404,
      );
    });

    it("acceptGroupInvite propagates GroupFullException with statusCode 409", async () => {
      vi.mocked(acceptGroupInviteUseCase.execute).mockRejectedValue(
        new GroupFullException(),
      );
      const request = createAuthRequest(
        { params: { id: "40" } },
        12,
      ) as unknown as FastifyRequest<{ Params: GroupInviteIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.acceptGroupInvite(request, reply),
        GroupFullException,
        409,
      );
    });

    it("leaveUserGroup propagates NotGroupMemberException with statusCode 404", async () => {
      vi.mocked(leaveUserGroupUseCase.execute).mockRejectedValue(
        new NotGroupMemberException(3),
      );
      const request = createAuthRequest({
        params: { id: "3" },
      }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.leaveUserGroup(request, reply),
        NotGroupMemberException,
        404,
      );
    });

    it("leaveUserGroup propagates UserGroupNotFoundException with statusCode 404", async () => {
      vi.mocked(leaveUserGroupUseCase.execute).mockRejectedValue(
        new UserGroupNotFoundException(3),
      );
      const request = createAuthRequest({
        params: { id: "3" },
      }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.leaveUserGroup(request, reply),
        UserGroupNotFoundException,
        404,
      );
    });

    it("removeGroupMember propagates NotGroupMemberException with statusCode 404", async () => {
      vi.mocked(removeGroupMemberUseCase.execute).mockRejectedValue(
        new NotGroupMemberException(3),
      );
      const request = createAuthRequest({
        params: { id: "3", userId: "15" },
      }) as unknown as FastifyRequest<{ Params: GroupMemberUserIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.removeGroupMember(request, reply),
        NotGroupMemberException,
        404,
      );
    });

    it("removeGroupMember propagates NotGroupOwnerException with statusCode 404", async () => {
      vi.mocked(removeGroupMemberUseCase.execute).mockRejectedValue(
        new NotGroupOwnerException(3),
      );
      const request = createAuthRequest({
        params: { id: "3", userId: "15" },
      }) as unknown as FastifyRequest<{ Params: GroupMemberUserIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.removeGroupMember(request, reply),
        NotGroupOwnerException,
        404,
      );
    });

    it("listGroupMembers propagates NotGroupMemberException with statusCode 404", async () => {
      vi.mocked(listGroupMembersUseCase.execute).mockRejectedValue(
        new NotGroupMemberException(3),
      );
      const request = createAuthRequest({
        params: { id: "3" },
      }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.listGroupMembers(request, reply),
        NotGroupMemberException,
        404,
      );
    });

    it("suggestGroupFriends propagates NotGroupMemberException with statusCode 404", async () => {
      vi.mocked(suggestGroupFriendsUseCase.execute).mockRejectedValue(
        new NotGroupMemberException(3),
      );
      const request = createAuthRequest({
        params: { id: "3" },
      }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.suggestGroupFriends(request, reply),
        NotGroupMemberException,
        404,
      );
    });

    it("updateUserGroup propagates UserGroupNotFoundException with statusCode 404", async () => {
      vi.mocked(updateUserGroupUseCase.execute).mockRejectedValue(
        new UserGroupNotFoundException(3),
      );
      const request = createAuthRequest({
        params: { id: "3" },
        body: { name: "Novo nome" },
      }) as unknown as FastifyRequest<{
        Params: UserGroupIdParams;
        Body: UpdateUserGroupDTO;
      }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.updateUserGroup(request, reply),
        UserGroupNotFoundException,
        404,
      );
    });

    it("updateUserGroup propagates NotGroupOwnerException with statusCode 404", async () => {
      vi.mocked(updateUserGroupUseCase.execute).mockRejectedValue(
        new NotGroupOwnerException(3),
      );
      const request = createAuthRequest({
        params: { id: "3" },
        body: { name: "Novo nome" },
      }) as unknown as FastifyRequest<{
        Params: UserGroupIdParams;
        Body: UpdateUserGroupDTO;
      }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.updateUserGroup(request, reply),
        NotGroupOwnerException,
        404,
      );
    });

    it("deleteUserGroup propagates UserGroupNotFoundException with statusCode 404", async () => {
      vi.mocked(deleteUserGroupUseCase.execute).mockRejectedValue(
        new UserGroupNotFoundException(3),
      );
      const request = createAuthRequest({
        params: { id: "3" },
      }) as unknown as FastifyRequest<{ Params: UserGroupIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.deleteUserGroup(request, reply),
        UserGroupNotFoundException,
        404,
      );
    });

    it("rejectGroupInvite propagates GroupInviteNotFoundException with statusCode 404", async () => {
      vi.mocked(rejectGroupInviteUseCase.execute).mockRejectedValue(
        new GroupInviteNotFoundException(40),
      );
      const request = createAuthRequest(
        { params: { id: "40" } },
        12,
      ) as unknown as FastifyRequest<{ Params: GroupInviteIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.rejectGroupInvite(request, reply),
        GroupInviteNotFoundException,
        404,
      );
    });

    it("cancelGroupInvite propagates GroupInviteNotFoundException with statusCode 404", async () => {
      vi.mocked(cancelGroupInviteUseCase.execute).mockRejectedValue(
        new GroupInviteNotFoundException(41),
      );
      const request = createAuthRequest({
        params: { id: "41" },
      }) as unknown as FastifyRequest<{ Params: GroupInviteIdParams }>;
      const reply = createReply();

      await expectPropagatesWithStatusCode(
        handlers.cancelGroupInvite(request, reply),
        GroupInviteNotFoundException,
        404,
      );
    });
  });

  it("rejects invalid group id before calling use case", async () => {
    const request = createAuthRequest({
      params: { id: "0" },
      body: { name: "Teste" },
    }) as unknown as FastifyRequest<{
      Params: UserGroupIdParams;
      Body: UpdateUserGroupDTO;
    }>;
    const reply = createReply();

    await expect(handlers.updateUserGroup(request, reply)).rejects.toBeInstanceOf(
      UserGroupValidationException,
    );
    expect(updateUserGroupUseCase.execute).not.toHaveBeenCalled();
  });

  it("throws validation exception when auth context is missing", async () => {
    const request = {} as FastifyRequest;
    const reply = createReply();

    await expect(handlers.listUserGroups(request, reply)).rejects.toBeInstanceOf(
      UserGroupValidationException,
    );
    expect(listUserGroupsUseCase.execute).not.toHaveBeenCalled();
  });

  it("uses userId from auth context instead of client input", async () => {
    vi.mocked(listUserGroupsUseCase.execute).mockResolvedValue([]);
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.listUserGroups(request, reply);

    const [calledUserId] = vi.mocked(listUserGroupsUseCase.execute).mock
      .calls[0]!;

    expect(calledUserId).toBe(7);
  });
});
