import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import { WrongMovieSchemaFromLlmException } from "@/domains/movies/domain/exceptions/wrong-movie-schema-from-llm.exception";
import {
  CreateGroupChatDTOSchema,
  GroupChatChatIdParamsSchema,
  GroupChatCreateResponseSchema,
  GroupChatGetResponseSchema,
  GroupChatGroupIdParamsSchema,
  GroupChatInvalidFilterMemberUserIdsResponseSchema,
  GroupChatListResponseSchema,
  GroupChatNumericIdParamsSchema,
  GroupChatRecommendationRequestDTOSchema,
  GroupChatRecommendationResponseSchema,
  GroupChatUpdateFilterMembersResponseSchema,
  GroupChatUpdateTitleResponseSchema,
  UpdateGroupChatFilterMembersDTOSchema,
  UpdateGroupChatTitleDTOSchema,
} from "../dto/group-chats.dto";

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

const internalServerErrorResponseSchema = z
  .object({
    error: z.enum([
      new WrongMovieSchemaFromLlmException().message,
      "Unkown Error",
    ]),
  })
  .describe("Internal Server Error");

export const CreateGroupChatDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Create a new group chat with server-generated chatId and default filterMemberUserIds for all current group members",
    params: GroupChatGroupIdParamsSchema,
    body: CreateGroupChatDTOSchema,
    response: {
      201: GroupChatCreateResponseSchema.describe("Created"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const ListGroupChatsDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "List group chats for an authenticated group member ordered by updatedAt descending",
    params: GroupChatGroupIdParamsSchema,
    response: {
      200: GroupChatListResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const GetGroupChatDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Get a single group chat with its chat history for an authenticated group member",
    params: GroupChatChatIdParamsSchema,
    response: {
      200: GroupChatGetResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const UpdateGroupChatTitleDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description: "Rename a group chat for an authenticated group member",
    params: GroupChatNumericIdParamsSchema,
    body: UpdateGroupChatTitleDTOSchema,
    response: {
      200: GroupChatUpdateTitleResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const DeleteGroupChatDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Delete a group chat and purge its chat history for an authenticated group member",
    params: GroupChatNumericIdParamsSchema,
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

export const UpdateGroupChatFilterMembersDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Update which group members are included in the watched-movie exclusion filter for a group chat",
    params: GroupChatNumericIdParamsSchema,
    body: UpdateGroupChatFilterMembersDTOSchema,
    response: {
      200: GroupChatUpdateFilterMembersResponseSchema.describe("Success"),
      400: z
        .union([
          badRequestResponseSchema,
          GroupChatInvalidFilterMemberUserIdsResponseSchema,
        ])
        .describe("Bad Request"),
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const RecommendInGroupChatDocs: RouteShorthandOptions = {
  schema: {
    tags: ["social"],
    description:
      "Get movie recommendations in a group chat using the shared filterMemberUserIds watched exclusion",
    params: GroupChatChatIdParamsSchema,
    body: GroupChatRecommendationRequestDTOSchema,
    response: {
      200: GroupChatRecommendationResponseSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
      500: internalServerErrorResponseSchema,
    },
  },
};
