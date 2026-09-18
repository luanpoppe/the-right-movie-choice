import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { Logger } from "@/lib/logger/logger";
import { AcceptFriendRequestUseCase } from "@/modules/social/application/use-cases/accept-friend-request.use-case";
import { CancelFriendRequestUseCase } from "@/modules/social/application/use-cases/cancel-friend-request.use-case";
import { ListFriendsUseCase } from "@/modules/social/application/use-cases/list-friends.use-case";
import { ListIncomingFriendRequestsUseCase } from "@/modules/social/application/use-cases/list-incoming-friend-requests.use-case";
import { ListOutgoingFriendRequestsUseCase } from "@/modules/social/application/use-cases/list-outgoing-friend-requests.use-case";
import { RejectFriendRequestUseCase } from "@/modules/social/application/use-cases/reject-friend-request.use-case";
import { RemoveFriendUseCase } from "@/modules/social/application/use-cases/remove-friend.use-case";
import { SearchUserByEmailUseCase } from "@/modules/social/application/use-cases/search-user-by-email.use-case";
import { SendFriendRequestUseCase } from "@/modules/social/application/use-cases/send-friend-request.use-case";
import { FriendRequestValidationException } from "@/modules/social/domain/exceptions/friend-request-validation.exception";
import {
  FriendRequestIdParams,
  FriendRequestIdParamsSchema,
  FriendUserIdParams,
  FriendUserIdParamsSchema,
  SearchUserByEmailQuery,
  SearchUserByEmailQuerySchema,
  SendFriendRequestDTO,
  SendFriendRequestDTOSchema,
} from "../dto/friendship.dto";
import { FriendshipResponseMapper } from "../mappers/friendship-response.mapper";

export type FriendshipControllerParams = {
  sendFriendRequestUseCase: SendFriendRequestUseCase;
  acceptFriendRequestUseCase: AcceptFriendRequestUseCase;
  rejectFriendRequestUseCase: RejectFriendRequestUseCase;
  cancelFriendRequestUseCase: CancelFriendRequestUseCase;
  removeFriendUseCase: RemoveFriendUseCase;
  listFriendsUseCase: ListFriendsUseCase;
  listIncomingFriendRequestsUseCase: ListIncomingFriendRequestsUseCase;
  listOutgoingFriendRequestsUseCase: ListOutgoingFriendRequestsUseCase;
  searchUserByEmailUseCase: SearchUserByEmailUseCase;
};

export type FriendshipControllerHandlers = {
  sendFriendRequest: (
    request: FastifyRequest<{ Body: SendFriendRequestDTO }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  acceptFriendRequest: (
    request: FastifyRequest<{ Params: FriendRequestIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  rejectFriendRequest: (
    request: FastifyRequest<{ Params: FriendRequestIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  cancelFriendRequest: (
    request: FastifyRequest<{ Params: FriendRequestIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  removeFriend: (
    request: FastifyRequest<{ Params: FriendUserIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  listFriends: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  listIncomingFriendRequests: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  listOutgoingFriendRequests: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  searchUserByEmail: (
    request: FastifyRequest<{ Querystring: SearchUserByEmailQuery }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
};

export class FriendshipController {
  static create(
    params: FriendshipControllerParams,
  ): FriendshipControllerHandlers {
    return {
      sendFriendRequest:
        FriendshipController.createSendFriendRequestHandler(params),
      acceptFriendRequest:
        FriendshipController.createAcceptFriendRequestHandler(params),
      rejectFriendRequest:
        FriendshipController.createRejectFriendRequestHandler(params),
      cancelFriendRequest:
        FriendshipController.createCancelFriendRequestHandler(params),
      removeFriend: FriendshipController.createRemoveFriendHandler(params),
      listFriends: FriendshipController.createListFriendsHandler(params),
      listIncomingFriendRequests:
        FriendshipController.createListIncomingFriendRequestsHandler(params),
      listOutgoingFriendRequests:
        FriendshipController.createListOutgoingFriendRequestsHandler(params),
      searchUserByEmail:
        FriendshipController.createSearchUserByEmailHandler(params),
    };
  }

  private static createSendFriendRequestHandler(
    params: FriendshipControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Body: SendFriendRequestDTO }>,
      reply: FastifyReply,
    ) => {
      const userId = FriendshipController.getUserId(request);
      const bodyDto = FriendshipController.parseOrThrow(
        SendFriendRequestDTOSchema,
        request.body,
      );
      const email = bodyDto.email;

      Logger.info("Sending friend request", { userId, email });

      const friendRequest = await params.sendFriendRequestUseCase.execute(
        userId,
        email,
      );
      const responseBody =
        FriendshipResponseMapper.toFriendRequestResponse(friendRequest);

      Logger.debug("Friend request sent via HTTP", {
        userId,
        friendRequestId: friendRequest.id,
      });

      return reply.status(201).send(responseBody);
    };
  }

  private static createAcceptFriendRequestHandler(
    params: FriendshipControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: FriendRequestIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = FriendshipController.getUserId(request);
      const routeParams = FriendshipController.parseOrThrow(
        FriendRequestIdParamsSchema,
        request.params,
      );
      const friendRequestId = routeParams.id;

      Logger.info("Accepting friend request", { userId, friendRequestId });

      const friendRequest = await params.acceptFriendRequestUseCase.execute(
        userId,
        friendRequestId,
      );
      const responseBody =
        FriendshipResponseMapper.toFriendRequestResponse(friendRequest);

      Logger.debug("Friend request accepted via HTTP", {
        userId,
        friendRequestId,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createRejectFriendRequestHandler(
    params: FriendshipControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: FriendRequestIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = FriendshipController.getUserId(request);
      const routeParams = FriendshipController.parseOrThrow(
        FriendRequestIdParamsSchema,
        request.params,
      );
      const friendRequestId = routeParams.id;

      Logger.info("Rejecting friend request", { userId, friendRequestId });

      const friendRequest = await params.rejectFriendRequestUseCase.execute(
        userId,
        friendRequestId,
      );
      const responseBody =
        FriendshipResponseMapper.toFriendRequestResponse(friendRequest);

      Logger.debug("Friend request rejected via HTTP", {
        userId,
        friendRequestId,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createCancelFriendRequestHandler(
    params: FriendshipControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: FriendRequestIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = FriendshipController.getUserId(request);
      const routeParams = FriendshipController.parseOrThrow(
        FriendRequestIdParamsSchema,
        request.params,
      );
      const friendRequestId = routeParams.id;

      Logger.info("Cancelling friend request", { userId, friendRequestId });

      await params.cancelFriendRequestUseCase.execute(userId, friendRequestId);

      Logger.debug("Friend request cancelled via HTTP", {
        userId,
        friendRequestId,
      });

      return reply.status(204).send();
    };
  }

  private static createRemoveFriendHandler(params: FriendshipControllerParams) {
    return async (
      request: FastifyRequest<{ Params: FriendUserIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = FriendshipController.getUserId(request);
      const routeParams = FriendshipController.parseOrThrow(
        FriendUserIdParamsSchema,
        request.params,
      );
      const friendUserId = routeParams.userId;

      Logger.info("Removing friend", { userId, friendUserId });

      await params.removeFriendUseCase.execute(userId, friendUserId);

      Logger.debug("Friend removed via HTTP", { userId, friendUserId });

      return reply.status(204).send();
    };
  }

  private static createListFriendsHandler(params: FriendshipControllerParams) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = FriendshipController.getUserId(request);

      Logger.info("Listing friends", { userId });

      const friends = await params.listFriendsUseCase.execute(userId);
      const responseBody =
        FriendshipResponseMapper.toListFriendsResponse(friends);

      Logger.debug("Friends listed via HTTP", {
        userId,
        count: friends.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createListIncomingFriendRequestsHandler(
    params: FriendshipControllerParams,
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = FriendshipController.getUserId(request);

      Logger.info("Listing incoming friend requests", { userId });

      const incomingRequests =
        await params.listIncomingFriendRequestsUseCase.execute(userId);
      const responseBody =
        FriendshipResponseMapper.toListIncomingFriendRequestsResponse(
          incomingRequests,
        );

      Logger.debug("Incoming friend requests listed via HTTP", {
        userId,
        count: incomingRequests.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createListOutgoingFriendRequestsHandler(
    params: FriendshipControllerParams,
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = FriendshipController.getUserId(request);

      Logger.info("Listing outgoing friend requests", { userId });

      const outgoingRequests =
        await params.listOutgoingFriendRequestsUseCase.execute(userId);
      const responseBody =
        FriendshipResponseMapper.toListOutgoingFriendRequestsResponse(
          outgoingRequests,
        );

      Logger.debug("Outgoing friend requests listed via HTTP", {
        userId,
        count: outgoingRequests.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createSearchUserByEmailHandler(
    params: FriendshipControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Querystring: SearchUserByEmailQuery }>,
      reply: FastifyReply,
    ) => {
      const userId = FriendshipController.getUserId(request);
      const queryDto = FriendshipController.parseOrThrow(
        SearchUserByEmailQuerySchema,
        request.query,
      );
      const email = queryDto.email;

      Logger.info("Searching user by email", { userId, email });

      const result = await params.searchUserByEmailUseCase.execute(
        userId,
        email,
      );
      const responseBody =
        FriendshipResponseMapper.toSearchUserByEmailResponse(result);

      Logger.debug("User found by email via HTTP", {
        userId,
        foundUserId: result.id,
        relationshipStatus: result.relationshipStatus,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static getUserId(request: FastifyRequest): number {
    const auth = request.userMovieEntryAuth;

    if (!auth) {
      throw new FriendRequestValidationException(
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

    throw new FriendRequestValidationException(message);
  }
}
