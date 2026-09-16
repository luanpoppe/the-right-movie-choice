import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { Logger } from "@/lib/logger/logger";
import { CreateUserConversationUseCase } from "@/domains/movies/application/use-cases/create-user-conversation.use-case";
import { DeleteUserConversationUseCase } from "@/domains/movies/application/use-cases/delete-user-conversation.use-case";
import { GetUserConversationUseCase } from "@/domains/movies/application/use-cases/get-user-conversation.use-case";
import { ListUserConversationsUseCase } from "@/domains/movies/application/use-cases/list-user-conversations.use-case";
import { UpdateUserConversationTitleUseCase } from "@/domains/movies/application/use-cases/update-user-conversation-title.use-case";
import { UserConversationValidationException } from "@/domains/movies/domain/exceptions/user-conversation-validation.exception";
import {
  UserConversationIdParams,
  UserConversationIdParamsSchema,
  UserConversationPatchDTO,
  UserConversationPatchDTOSchema,
} from "../dto/user-conversation.dto";
import { UserConversationResponseMapper } from "../mappers/user-conversation-response.mapper";

export type UserConversationControllerParams = {
  createUserConversationUseCase: CreateUserConversationUseCase;
  listUserConversationsUseCase: ListUserConversationsUseCase;
  getUserConversationUseCase: GetUserConversationUseCase;
  updateUserConversationTitleUseCase: UpdateUserConversationTitleUseCase;
  deleteUserConversationUseCase: DeleteUserConversationUseCase;
};

export type UserConversationControllerHandlers = {
  create: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  list: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  getById: (
    request: FastifyRequest<{ Params: UserConversationIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  patch: (
    request: FastifyRequest<{
      Params: UserConversationIdParams;
      Body: UserConversationPatchDTO;
    }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  delete: (
    request: FastifyRequest<{ Params: UserConversationIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
};

export class UserConversationController {
  static create(
    params: UserConversationControllerParams,
  ): UserConversationControllerHandlers {
    return {
      create: UserConversationController.createCreateHandler(params),
      list: UserConversationController.createListHandler(params),
      getById: UserConversationController.createGetByIdHandler(params),
      patch: UserConversationController.createPatchHandler(params),
      delete: UserConversationController.createDeleteHandler(params),
    };
  }

  private static createCreateHandler(params: UserConversationControllerParams) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = UserConversationController.getUserId(request);

      Logger.info("🚀 Creating user conversation", { userId });

      const conversation =
        await params.createUserConversationUseCase.execute(userId);
      const responseBody =
        UserConversationResponseMapper.toCreateResponse(conversation);

      Logger.debug("✅ User conversation created", {
        userId,
        conversationId: conversation.id,
        chatId: conversation.chatId,
      });

      return reply.status(201).send(responseBody);
    };
  }

  private static createListHandler(params: UserConversationControllerParams) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = UserConversationController.getUserId(request);

      Logger.info("📋 Listing user conversations", { userId });

      const conversations =
        await params.listUserConversationsUseCase.execute(userId);
      const responseBody =
        UserConversationResponseMapper.toListResponse(conversations);

      Logger.debug("✅ User conversations listed", {
        userId,
        count: conversations.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createGetByIdHandler(params: UserConversationControllerParams) {
    return async (
      request: FastifyRequest<{ Params: UserConversationIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserConversationController.getUserId(request);
      const routeParams = UserConversationController.parseOrThrow(
        UserConversationIdParamsSchema,
        request.params,
      );
      const conversationId = routeParams.id;

      Logger.info("🔍 Fetching user conversation", {
        userId,
        conversationId,
      });

      const result = await params.getUserConversationUseCase.execute(
        userId,
        conversationId,
      );
      const responseBody = UserConversationResponseMapper.toGetResponse(result);

      Logger.debug("✅ User conversation retrieved", {
        userId,
        conversationId,
        messageCount: result.messages.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createPatchHandler(params: UserConversationControllerParams) {
    return async (
      request: FastifyRequest<{
        Params: UserConversationIdParams;
        Body: UserConversationPatchDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const userId = UserConversationController.getUserId(request);
      const routeParams = UserConversationController.parseOrThrow(
        UserConversationIdParamsSchema,
        request.params,
      );
      const conversationId = routeParams.id;
      const patchDto = UserConversationController.parseOrThrow(
        UserConversationPatchDTOSchema,
        request.body,
      );
      const title = patchDto.title;

      Logger.info("💾 Patching user conversation title", {
        userId,
        conversationId,
      });

      const conversation =
        await params.updateUserConversationTitleUseCase.execute(
          userId,
          conversationId,
          title,
        );
      const responseBody =
        UserConversationResponseMapper.toPatchResponse(conversation);

      Logger.debug("✅ User conversation title patched", {
        userId,
        conversationId,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createDeleteHandler(params: UserConversationControllerParams) {
    return async (
      request: FastifyRequest<{ Params: UserConversationIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserConversationController.getUserId(request);
      const routeParams = UserConversationController.parseOrThrow(
        UserConversationIdParamsSchema,
        request.params,
      );
      const conversationId = routeParams.id;

      Logger.info("🗑️ Deleting user conversation", {
        userId,
        conversationId,
      });

      await params.deleteUserConversationUseCase.execute(
        userId,
        conversationId,
      );

      Logger.debug("✅ User conversation deleted", {
        userId,
        conversationId,
      });

      return reply.status(204).send();
    };
  }

  private static getUserId(request: FastifyRequest): number {
    const auth = request.userMovieEntryAuth;

    if (!auth) {
      throw new UserConversationValidationException(
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

    throw new UserConversationValidationException(message);
  }
}
