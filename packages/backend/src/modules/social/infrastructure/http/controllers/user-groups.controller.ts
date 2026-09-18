import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { Logger } from "@/lib/logger/logger";
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
import {
  UpdateUserGroupPatch,
  UpdateUserGroupUseCase,
} from "@/modules/social/application/use-cases/update-user-group.use-case";
import { UserGroupValidationException } from "@/modules/social/domain/exceptions/user-group-validation.exception";
import {
  CreateUserGroupDTO,
  CreateUserGroupDTOSchema,
  GroupInviteIdParams,
  GroupInviteIdParamsSchema,
  GroupMemberUserIdParams,
  GroupMemberUserIdParamsSchema,
  SendGroupInviteDTO,
  SendGroupInviteDTOSchema,
  UpdateUserGroupDTO,
  UpdateUserGroupDTOSchema,
  UserGroupIdParams,
  UserGroupIdParamsSchema,
} from "../dto/user-groups.dto";
import { UserGroupsResponseMapper } from "../mappers/user-groups-response.mapper";

export type UserGroupsControllerParams = {
  createUserGroupUseCase: CreateUserGroupUseCase;
  listUserGroupsUseCase: ListUserGroupsUseCase;
  updateUserGroupUseCase: UpdateUserGroupUseCase;
  deleteUserGroupUseCase: DeleteUserGroupUseCase;
  sendGroupInviteUseCase: SendGroupInviteUseCase;
  leaveUserGroupUseCase: LeaveUserGroupUseCase;
  removeGroupMemberUseCase: RemoveGroupMemberUseCase;
  listGroupMembersUseCase: ListGroupMembersUseCase;
  suggestGroupFriendsUseCase: SuggestGroupFriendsUseCase;
  acceptGroupInviteUseCase: AcceptGroupInviteUseCase;
  rejectGroupInviteUseCase: RejectGroupInviteUseCase;
  cancelGroupInviteUseCase: CancelGroupInviteUseCase;
  listIncomingGroupInvitesUseCase: ListIncomingGroupInvitesUseCase;
};

export type UserGroupsControllerHandlers = {
  createUserGroup: (
    request: FastifyRequest<{ Body: CreateUserGroupDTO }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  listUserGroups: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  updateUserGroup: (
    request: FastifyRequest<{
      Params: UserGroupIdParams;
      Body: UpdateUserGroupDTO;
    }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  deleteUserGroup: (
    request: FastifyRequest<{ Params: UserGroupIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  sendGroupInvite: (
    request: FastifyRequest<{
      Params: UserGroupIdParams;
      Body: SendGroupInviteDTO;
    }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  leaveUserGroup: (
    request: FastifyRequest<{ Params: UserGroupIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  removeGroupMember: (
    request: FastifyRequest<{ Params: GroupMemberUserIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  listGroupMembers: (
    request: FastifyRequest<{ Params: UserGroupIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  suggestGroupFriends: (
    request: FastifyRequest<{ Params: UserGroupIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  acceptGroupInvite: (
    request: FastifyRequest<{ Params: GroupInviteIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  rejectGroupInvite: (
    request: FastifyRequest<{ Params: GroupInviteIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  cancelGroupInvite: (
    request: FastifyRequest<{ Params: GroupInviteIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  listIncomingGroupInvites: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
};

export class UserGroupsController {
  static create(
    params: UserGroupsControllerParams,
  ): UserGroupsControllerHandlers {
    return {
      createUserGroup: UserGroupsController.createCreateUserGroupHandler(params),
      listUserGroups: UserGroupsController.createListUserGroupsHandler(params),
      updateUserGroup: UserGroupsController.createUpdateUserGroupHandler(params),
      deleteUserGroup: UserGroupsController.createDeleteUserGroupHandler(params),
      sendGroupInvite: UserGroupsController.createSendGroupInviteHandler(params),
      leaveUserGroup: UserGroupsController.createLeaveUserGroupHandler(params),
      removeGroupMember:
        UserGroupsController.createRemoveGroupMemberHandler(params),
      listGroupMembers:
        UserGroupsController.createListGroupMembersHandler(params),
      suggestGroupFriends:
        UserGroupsController.createSuggestGroupFriendsHandler(params),
      acceptGroupInvite:
        UserGroupsController.createAcceptGroupInviteHandler(params),
      rejectGroupInvite:
        UserGroupsController.createRejectGroupInviteHandler(params),
      cancelGroupInvite:
        UserGroupsController.createCancelGroupInviteHandler(params),
      listIncomingGroupInvites:
        UserGroupsController.createListIncomingGroupInvitesHandler(params),
    };
  }

  private static createCreateUserGroupHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Body: CreateUserGroupDTO }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const bodyDto = UserGroupsController.parseOrThrow(
        CreateUserGroupDTOSchema,
        request.body,
      );
      const name = bodyDto.name;
      const description = bodyDto.description;

      Logger.info("Creating user group", { userId, name });

      const group = await params.createUserGroupUseCase.execute(
        userId,
        name,
        description,
      );
      const responseBody = UserGroupsResponseMapper.toUserGroupResponse(group);

      Logger.debug("User group created via HTTP", {
        userId,
        groupId: group.id,
      });

      return reply.status(201).send(responseBody);
    };
  }

  private static createListUserGroupsHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = UserGroupsController.getUserId(request);

      Logger.info("Listing user groups", { userId });

      const groups = await params.listUserGroupsUseCase.execute(userId);
      const responseBody =
        UserGroupsResponseMapper.toListUserGroupsResponse(groups);

      Logger.debug("User groups listed via HTTP", {
        userId,
        count: groups.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createUpdateUserGroupHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{
        Params: UserGroupIdParams;
        Body: UpdateUserGroupDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        UserGroupIdParamsSchema,
        request.params,
      );
      const bodyDto = UserGroupsController.parseOrThrow(
        UpdateUserGroupDTOSchema,
        request.body,
      );
      const groupId = routeParams.id;

      Logger.info("Updating user group", { userId, groupId });

      const patch = UserGroupsController.toUpdateUserGroupPatch(bodyDto);
      const group = await params.updateUserGroupUseCase.execute(
        userId,
        groupId,
        patch,
      );
      const responseBody = UserGroupsResponseMapper.toUserGroupResponse(group);

      Logger.debug("User group updated via HTTP", {
        userId,
        groupId,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createDeleteUserGroupHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: UserGroupIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        UserGroupIdParamsSchema,
        request.params,
      );
      const groupId = routeParams.id;

      Logger.info("Deleting user group", { userId, groupId });

      await params.deleteUserGroupUseCase.execute(userId, groupId);

      Logger.debug("User group deleted via HTTP", {
        userId,
        groupId,
      });

      return reply.status(204).send();
    };
  }

  private static createSendGroupInviteHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{
        Params: UserGroupIdParams;
        Body: SendGroupInviteDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        UserGroupIdParamsSchema,
        request.params,
      );
      const bodyDto = UserGroupsController.parseOrThrow(
        SendGroupInviteDTOSchema,
        request.body,
      );
      const groupId = routeParams.id;
      const email = bodyDto.email;

      Logger.info("Sending group invite", { userId, groupId, email });

      const groupInvite = await params.sendGroupInviteUseCase.execute(
        userId,
        groupId,
        email,
      );
      const responseBody =
        UserGroupsResponseMapper.toGroupInviteResponse(groupInvite);

      Logger.debug("Group invite sent via HTTP", {
        userId,
        groupId,
        groupInviteId: groupInvite.id,
      });

      return reply.status(201).send(responseBody);
    };
  }

  private static createLeaveUserGroupHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: UserGroupIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        UserGroupIdParamsSchema,
        request.params,
      );
      const groupId = routeParams.id;

      Logger.info("Leaving user group", { userId, groupId });

      await params.leaveUserGroupUseCase.execute(userId, groupId);

      Logger.debug("User left group via HTTP", {
        userId,
        groupId,
      });

      return reply.status(204).send();
    };
  }

  private static createRemoveGroupMemberHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: GroupMemberUserIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        GroupMemberUserIdParamsSchema,
        request.params,
      );
      const groupId = routeParams.id;
      const targetMemberId = routeParams.userId;

      Logger.info("Removing group member", {
        userId,
        groupId,
        targetMemberId,
      });

      await params.removeGroupMemberUseCase.execute(
        userId,
        groupId,
        targetMemberId,
      );

      Logger.debug("Group member removed via HTTP", {
        userId,
        groupId,
        targetMemberId,
      });

      return reply.status(204).send();
    };
  }

  private static createListGroupMembersHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: UserGroupIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        UserGroupIdParamsSchema,
        request.params,
      );
      const groupId = routeParams.id;

      Logger.info("Listing group members", { userId, groupId });

      const members = await params.listGroupMembersUseCase.execute(
        userId,
        groupId,
      );
      const responseBody =
        UserGroupsResponseMapper.toListGroupMembersResponse(members);

      Logger.debug("Group members listed via HTTP", {
        userId,
        groupId,
        count: members.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createSuggestGroupFriendsHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: UserGroupIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        UserGroupIdParamsSchema,
        request.params,
      );
      const groupId = routeParams.id;

      Logger.info("Suggesting group friends", { userId, groupId });

      const suggestions = await params.suggestGroupFriendsUseCase.execute(
        userId,
        groupId,
      );
      const responseBody =
        UserGroupsResponseMapper.toListGroupFriendSuggestionsResponse(
          suggestions,
        );

      Logger.debug("Group friend suggestions listed via HTTP", {
        userId,
        groupId,
        count: suggestions.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createAcceptGroupInviteHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: GroupInviteIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        GroupInviteIdParamsSchema,
        request.params,
      );
      const groupInviteId = routeParams.id;

      Logger.info("Accepting group invite", { userId, groupInviteId });

      const groupInvite = await params.acceptGroupInviteUseCase.execute(
        userId,
        groupInviteId,
      );
      const responseBody =
        UserGroupsResponseMapper.toGroupInviteResponse(groupInvite);

      Logger.debug("Group invite accepted via HTTP", {
        userId,
        groupInviteId,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createRejectGroupInviteHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: GroupInviteIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        GroupInviteIdParamsSchema,
        request.params,
      );
      const groupInviteId = routeParams.id;

      Logger.info("Rejecting group invite", { userId, groupInviteId });

      const groupInvite = await params.rejectGroupInviteUseCase.execute(
        userId,
        groupInviteId,
      );
      const responseBody =
        UserGroupsResponseMapper.toGroupInviteResponse(groupInvite);

      Logger.debug("Group invite rejected via HTTP", {
        userId,
        groupInviteId,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createCancelGroupInviteHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: GroupInviteIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserGroupsController.getUserId(request);
      const routeParams = UserGroupsController.parseOrThrow(
        GroupInviteIdParamsSchema,
        request.params,
      );
      const groupInviteId = routeParams.id;

      Logger.info("Cancelling group invite", { userId, groupInviteId });

      await params.cancelGroupInviteUseCase.execute(userId, groupInviteId);

      Logger.debug("Group invite cancelled via HTTP", {
        userId,
        groupInviteId,
      });

      return reply.status(204).send();
    };
  }

  private static createListIncomingGroupInvitesHandler(
    params: UserGroupsControllerParams,
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = UserGroupsController.getUserId(request);

      Logger.info("Listing incoming group invites", { userId });

      const incomingInvites =
        await params.listIncomingGroupInvitesUseCase.execute(userId);
      const responseBody =
        UserGroupsResponseMapper.toListIncomingGroupInvitesResponse(
          incomingInvites,
        );

      Logger.debug("Incoming group invites listed via HTTP", {
        userId,
        count: incomingInvites.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static toUpdateUserGroupPatch(
    bodyDto: UpdateUserGroupDTO,
  ): UpdateUserGroupPatch {
    const patch: UpdateUserGroupPatch = {};

    if (bodyDto.name !== undefined) {
      patch.name = bodyDto.name;
    }

    if (bodyDto.description !== undefined) {
      patch.description = bodyDto.description;
    }

    return patch;
  }

  private static getUserId(request: FastifyRequest): number {
    const auth = request.userMovieEntryAuth;

    if (!auth) {
      throw new UserGroupValidationException(
        "Authenticated user context is required",
      );
    }

    return auth.userId;
  }

  private static parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
    const parsed = schema.safeParse(data);

    if (parsed.success) {
      return parsed.data;
    }

    const firstIssue = parsed.error.issues[0];
    const message = firstIssue?.message ?? "Validation failed";

    throw new UserGroupValidationException(message);
  }
}
