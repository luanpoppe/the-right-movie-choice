import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import {
  FriendRequestIdParamsSchema,
  FriendRequestResponseSchema,
  FriendUserIdParamsSchema,
  ListFriendsResponseSchema,
  ListIncomingFriendRequestsResponseSchema,
  ListOutgoingFriendRequestsResponseSchema,
  SearchUserByEmailQuerySchema,
  SearchUserByEmailResponseSchema,
  SendFriendRequestDTOSchema,
} from "../dto/friendship.dto";

const badRequestResponseSchema = z
  .object({ error: z.string().or(z.array(z.any())) })
  .describe("Bad Request");

const unauthorizedResponseSchema = z
  .object({
    error: z.enum([new InvalidAccessTokenException().message]),
  })
  .describe("Unauthorized");

const notFoundResponseSchema = z
  .object({ error: z.string() })
  .describe("Not Found");

const conflictResponseSchema = z
  .object({ error: z.string() })
  .describe("Conflict");

export const SendFriendRequestDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Send a friend request to another user identified by email address",
    body: SendFriendRequestDTOSchema,
    response: {
      201: FriendRequestResponseSchema.describe("Created"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
      409: conflictResponseSchema,
    },
  },
};

export const AcceptFriendRequestDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Accept a pending friend request received by the authenticated user",
    params: FriendRequestIdParamsSchema,
    response: {
      200: FriendRequestResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const RejectFriendRequestDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Reject a pending friend request received by the authenticated user",
    params: FriendRequestIdParamsSchema,
    response: {
      200: FriendRequestResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const CancelFriendRequestDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Cancel a pending friend request sent by the authenticated user",
    params: FriendRequestIdParamsSchema,
    response: {
      204: {
        type: "null",
        description: "No Content",
      },
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const RemoveFriendDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Remove an accepted friendship with another user",
    params: FriendUserIdParamsSchema,
    response: {
      204: {
        type: "null",
        description: "No Content",
      },
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const ListFriendsDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "List accepted friends of the authenticated user",
    response: {
      200: ListFriendsResponseSchema.describe("Success"),
      401: unauthorizedResponseSchema,
    },
  },
};

export const ListIncomingFriendRequestsDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "List pending friend requests received by the authenticated user",
    response: {
      200: ListIncomingFriendRequestsResponseSchema.describe("Success"),
      401: unauthorizedResponseSchema,
    },
  },
};

export const ListOutgoingFriendRequestsDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "List pending friend requests sent by the authenticated user",
    response: {
      200: ListOutgoingFriendRequestsResponseSchema.describe("Success"),
      401: unauthorizedResponseSchema,
    },
  },
};

export const SearchUserByEmailDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Search for a user by email and return their public profile with relationship status",
    querystring: SearchUserByEmailQuerySchema,
    response: {
      200: SearchUserByEmailResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};
