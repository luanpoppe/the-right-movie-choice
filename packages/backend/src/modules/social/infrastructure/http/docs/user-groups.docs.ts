import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import {
  CreateUserGroupDTOSchema,
  GroupInviteIdParamsSchema,
  GroupInviteResponseSchema,
  GroupMemberUserIdParamsSchema,
  ListGroupFriendSuggestionsResponseSchema,
  ListGroupMembersResponseSchema,
  ListIncomingGroupInvitesResponseSchema,
  ListUserGroupsResponseSchema,
  SendGroupInviteDTOSchema,
  UpdateUserGroupDTOSchema,
  UserGroupIdParamsSchema,
  UserGroupResponseSchema,
} from "../dto/user-groups.dto";

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

export const CreateUserGroupDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Create a new user group owned by the authenticated user",
    body: CreateUserGroupDTOSchema,
    response: {
      201: UserGroupResponseSchema.describe("Created"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
    },
  },
};

export const ListUserGroupsDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "List groups where the authenticated user is a member",
    response: {
      200: ListUserGroupsResponseSchema.describe("Success"),
      401: unauthorizedResponseSchema,
    },
  },
};

export const UpdateUserGroupDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Update group name and/or description (group owner only, partial body)",
    params: UserGroupIdParamsSchema,
    body: UpdateUserGroupDTOSchema,
    response: {
      200: UserGroupResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const DeleteUserGroupDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Delete a group (group owner only)",
    params: UserGroupIdParamsSchema,
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

export const SendGroupInviteDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Invite a user to the group by email (any group member may invite)",
    params: UserGroupIdParamsSchema,
    body: SendGroupInviteDTOSchema,
    response: {
      201: GroupInviteResponseSchema.describe("Created"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
      409: conflictResponseSchema,
    },
  },
};

export const LeaveUserGroupDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Leave a group as the authenticated member (owner transfer or dissolve when sole member)",
    params: UserGroupIdParamsSchema,
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

export const RemoveGroupMemberDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Remove a member from the group (group owner only)",
    params: GroupMemberUserIdParamsSchema,
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

export const SuggestGroupFriendsDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Suggest accepted friends who are not yet members of the group",
    params: UserGroupIdParamsSchema,
    response: {
      200: ListGroupFriendSuggestionsResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const ListGroupMembersDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "List members of a group (authenticated member only)",
    params: UserGroupIdParamsSchema,
    response: {
      200: ListGroupMembersResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const AcceptGroupInviteDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Accept a pending group invite received by the authenticated user",
    params: GroupInviteIdParamsSchema,
    response: {
      200: GroupInviteResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
      409: conflictResponseSchema,
    },
  },
};

export const RejectGroupInviteDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Reject a pending group invite received by the authenticated user",
    params: GroupInviteIdParamsSchema,
    response: {
      200: GroupInviteResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const CancelGroupInviteDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Cancel a pending group invite sent by the authenticated user",
    params: GroupInviteIdParamsSchema,
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

export const ListIncomingGroupInvitesDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "List pending group invites received by the authenticated user",
    response: {
      200: ListIncomingGroupInvitesResponseSchema.describe("Success"),
      401: unauthorizedResponseSchema,
    },
  },
};
