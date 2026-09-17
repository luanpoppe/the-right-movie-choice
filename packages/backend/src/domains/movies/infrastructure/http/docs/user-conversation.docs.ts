import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import {
  UserConversationCreateResponseDTOSchema,
  UserConversationGetResponseDTOSchema,
  UserConversationIdParamsSchema,
  UserConversationListResponseDTOSchema,
  UserConversationPatchDTOSchema,
  UserConversationPatchResponseDTOSchema,
} from "../dto/user-conversation.dto";

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

export const UserConversationCreateDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Create a new conversation for the authenticated user with a server-generated chatId",
    response: {
      201: UserConversationCreateResponseDTOSchema.describe("Created"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
    },
  },
};

export const UserConversationListDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "List the authenticated user's conversations ordered by updatedAt descending",
    response: {
      200: UserConversationListResponseDTOSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
    },
  },
};

export const UserConversationGetDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Get a single conversation with its chat history for the authenticated user",
    params: UserConversationIdParamsSchema,
    response: {
      200: UserConversationGetResponseDTOSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const UserConversationPatchDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description: "Rename a conversation for the authenticated user",
    params: UserConversationIdParamsSchema,
    body: UserConversationPatchDTOSchema,
    response: {
      200: UserConversationPatchResponseDTOSchema.describe("Success"),
      400: badRequestResponseSchema,
      401: unauthorizedResponseSchema,
      404: notFoundResponseSchema,
    },
  },
};

export const UserConversationDeleteDocs: RouteShorthandOptions = {
  schema: {
    tags: ["movies"],
    description:
      "Delete a conversation and its chat history for the authenticated user",
    params: UserConversationIdParamsSchema,
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
