import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { Logger } from "@/lib/logger/logger";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { MovieRecommendationResponseMapper } from "@/domains/movies/infrastructure/http/mappers/movie-recommendation-response.mapper";
import { CreateGroupChatUseCase } from "@/modules/social/application/use-cases/create-group-chat.use-case";
import { DeleteGroupChatUseCase } from "@/modules/social/application/use-cases/delete-group-chat.use-case";
import { GetGroupChatUseCase } from "@/modules/social/application/use-cases/get-group-chat.use-case";
import { ListGroupChatsUseCase } from "@/modules/social/application/use-cases/list-group-chats.use-case";
import { RecommendInGroupChatUseCase } from "@/modules/social/application/use-cases/recommend-in-group-chat.use-case";
import { UpdateGroupChatFilterMembersUseCase } from "@/modules/social/application/use-cases/update-group-chat-filter-members.use-case";
import { UpdateGroupChatTitleUseCase } from "@/modules/social/application/use-cases/update-group-chat-title.use-case";
import { GroupChatInvalidFilterMemberUserIdsException } from "@/modules/social/domain/exceptions/group-chat-invalid-filter-member-user-ids.exception";
import { GroupChatValidationException } from "@/modules/social/domain/exceptions/group-chat-validation.exception";
import {
  CreateGroupChatDTO,
  CreateGroupChatDTOSchema,
  GroupChatChatIdParams,
  GroupChatChatIdParamsSchema,
  GroupChatGroupIdParams,
  GroupChatGroupIdParamsSchema,
  GroupChatNumericIdParams,
  GroupChatNumericIdParamsSchema,
  GroupChatRecommendationRequestDTO,
  GroupChatRecommendationRequestDTOSchema,
  UpdateGroupChatFilterMembersDTO,
  UpdateGroupChatFilterMembersDTOSchema,
  UpdateGroupChatTitleDTO,
  UpdateGroupChatTitleDTOSchema,
} from "../dto/group-chats.dto";
import { GroupChatsResponseMapper } from "../mappers/group-chats-response.mapper";

export type GroupChatsControllerParams = {
  createGroupChatUseCase: CreateGroupChatUseCase;
  listGroupChatsUseCase: ListGroupChatsUseCase;
  getGroupChatUseCase: GetGroupChatUseCase;
  updateGroupChatTitleUseCase: UpdateGroupChatTitleUseCase;
  deleteGroupChatUseCase: DeleteGroupChatUseCase;
  updateGroupChatFilterMembersUseCase: UpdateGroupChatFilterMembersUseCase;
  recommendInGroupChatUseCase: RecommendInGroupChatUseCase;
  catalogRepository: IMovieCatalogRepository;
};

export type GroupChatsControllerHandlers = {
  createGroupChat: (
    request: FastifyRequest<{
      Params: GroupChatGroupIdParams;
      Body: CreateGroupChatDTO;
    }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  listGroupChats: (
    request: FastifyRequest<{ Params: GroupChatGroupIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  getGroupChat: (
    request: FastifyRequest<{ Params: GroupChatChatIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  updateGroupChatTitle: (
    request: FastifyRequest<{
      Params: GroupChatNumericIdParams;
      Body: UpdateGroupChatTitleDTO;
    }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  deleteGroupChat: (
    request: FastifyRequest<{ Params: GroupChatNumericIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  updateGroupChatFilterMembers: (
    request: FastifyRequest<{
      Params: GroupChatNumericIdParams;
      Body: UpdateGroupChatFilterMembersDTO;
    }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  recommendInGroupChat: (
    request: FastifyRequest<{
      Params: GroupChatChatIdParams;
      Body: GroupChatRecommendationRequestDTO;
    }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
};

export class GroupChatsController {
  static create(
    params: GroupChatsControllerParams,
  ): GroupChatsControllerHandlers {
    const movieRecommendationResponseMapper =
      new MovieRecommendationResponseMapper(params.catalogRepository);

    return {
      createGroupChat:
        GroupChatsController.createCreateGroupChatHandler(params),
      listGroupChats:
        GroupChatsController.createListGroupChatsHandler(params),
      getGroupChat: GroupChatsController.createGetGroupChatHandler(params),
      updateGroupChatTitle:
        GroupChatsController.createUpdateGroupChatTitleHandler(params),
      deleteGroupChat:
        GroupChatsController.createDeleteGroupChatHandler(params),
      updateGroupChatFilterMembers:
        GroupChatsController.createUpdateGroupChatFilterMembersHandler(params),
      recommendInGroupChat:
        GroupChatsController.createRecommendInGroupChatHandler(
          params,
          movieRecommendationResponseMapper,
        ),
    };
  }

  private static createCreateGroupChatHandler(
    params: GroupChatsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{
        Params: GroupChatGroupIdParams;
        Body: CreateGroupChatDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const userId = GroupChatsController.getUserId(request);
      const routeParams = GroupChatsController.parseOrThrow(
        GroupChatGroupIdParamsSchema,
        request.params,
      );
      const bodyDto = GroupChatsController.parseOrThrow(
        CreateGroupChatDTOSchema,
        request.body,
      );
      const groupId = routeParams.groupId;
      const title = bodyDto.title;

      Logger.info("Creating group chat", { userId, groupId, title });

      const chat = await params.createGroupChatUseCase.execute(
        userId,
        groupId,
        title,
      );
      const responseBody = GroupChatsResponseMapper.toCreateResponse(chat);

      Logger.debug("Group chat created via HTTP", {
        userId,
        groupId,
        groupChatId: chat.id,
        chatId: chat.chatId,
      });

      return reply.status(201).send(responseBody);
    };
  }

  private static createListGroupChatsHandler(
    params: GroupChatsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: GroupChatGroupIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = GroupChatsController.getUserId(request);
      const routeParams = GroupChatsController.parseOrThrow(
        GroupChatGroupIdParamsSchema,
        request.params,
      );
      const groupId = routeParams.groupId;

      Logger.info("Listing group chats", { userId, groupId });

      const chats = await params.listGroupChatsUseCase.execute(
        userId,
        groupId,
      );
      const responseBody = GroupChatsResponseMapper.toListResponse(chats);

      Logger.debug("Group chats listed via HTTP", {
        userId,
        groupId,
        count: chats.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createGetGroupChatHandler(params: GroupChatsControllerParams) {
    return async (
      request: FastifyRequest<{ Params: GroupChatChatIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = GroupChatsController.getUserId(request);
      const routeParams = GroupChatsController.parseOrThrow(
        GroupChatChatIdParamsSchema,
        request.params,
      );
      const groupId = routeParams.groupId;
      const chatId = routeParams.chatId;

      Logger.info("Fetching group chat", { userId, groupId, chatId });

      const result = await params.getGroupChatUseCase.execute(
        userId,
        groupId,
        chatId,
      );
      const responseBody = GroupChatsResponseMapper.toGetResponse(result);

      Logger.debug("Group chat retrieved via HTTP", {
        userId,
        groupId,
        chatId,
        messageCount: result.messages.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createUpdateGroupChatTitleHandler(
    params: GroupChatsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{
        Params: GroupChatNumericIdParams;
        Body: UpdateGroupChatTitleDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const userId = GroupChatsController.getUserId(request);
      const routeParams = GroupChatsController.parseOrThrow(
        GroupChatNumericIdParamsSchema,
        request.params,
      );
      const bodyDto = GroupChatsController.parseOrThrow(
        UpdateGroupChatTitleDTOSchema,
        request.body,
      );
      const groupId = routeParams.groupId;
      const groupChatId = routeParams.id;
      const title = bodyDto.title;

      Logger.info("Updating group chat title", {
        userId,
        groupId,
        groupChatId,
      });

      const chat = await params.updateGroupChatTitleUseCase.execute(
        userId,
        groupId,
        groupChatId,
        title,
      );
      const responseBody =
        GroupChatsResponseMapper.toUpdateTitleResponse(chat);

      Logger.debug("Group chat title updated via HTTP", {
        userId,
        groupId,
        groupChatId,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createDeleteGroupChatHandler(
    params: GroupChatsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: GroupChatNumericIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = GroupChatsController.getUserId(request);
      const routeParams = GroupChatsController.parseOrThrow(
        GroupChatNumericIdParamsSchema,
        request.params,
      );
      const groupId = routeParams.groupId;
      const groupChatId = routeParams.id;

      Logger.info("Deleting group chat", {
        userId,
        groupId,
        groupChatId,
      });

      await params.deleteGroupChatUseCase.execute(
        userId,
        groupId,
        groupChatId,
      );

      Logger.debug("Group chat deleted via HTTP", {
        userId,
        groupId,
        groupChatId,
      });

      return reply.status(204).send();
    };
  }

  private static createUpdateGroupChatFilterMembersHandler(
    params: GroupChatsControllerParams,
  ) {
    return async (
      request: FastifyRequest<{
        Params: GroupChatNumericIdParams;
        Body: UpdateGroupChatFilterMembersDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const userId = GroupChatsController.getUserId(request);
      const routeParams = GroupChatsController.parseOrThrow(
        GroupChatNumericIdParamsSchema,
        request.params,
      );
      const bodyDto = GroupChatsController.parseOrThrow(
        UpdateGroupChatFilterMembersDTOSchema,
        request.body,
      );
      const groupId = routeParams.groupId;
      const groupChatId = routeParams.id;
      const filterMemberUserIds = bodyDto.userIds;

      Logger.info("Updating group chat filter members", {
        userId,
        groupId,
        groupChatId,
        filterMemberCount: filterMemberUserIds.length,
      });

      try {
        const chat = await params.updateGroupChatFilterMembersUseCase.execute(
          userId,
          groupId,
          groupChatId,
          filterMemberUserIds,
        );
        const responseBody =
          GroupChatsResponseMapper.toUpdateFilterMembersResponse(chat);

        Logger.debug("Group chat filter members updated via HTTP", {
          userId,
          groupId,
          groupChatId,
        });

        return reply.status(200).send(responseBody);
      } catch (error) {
        const isInvalidFilterMembersError =
          error instanceof GroupChatInvalidFilterMemberUserIdsException;

        if (isInvalidFilterMembersError) {
          const invalidUserIds = error.invalidUserIds;
          const errorBody = {
            error: error.message,
            invalidUserIds,
          };

          return reply.status(400).send(errorBody);
        }

        throw error;
      }
    };
  }

  private static createRecommendInGroupChatHandler(
    params: GroupChatsControllerParams,
    movieRecommendationResponseMapper: MovieRecommendationResponseMapper,
  ) {
    return async (
      request: FastifyRequest<{
        Params: GroupChatChatIdParams;
        Body: GroupChatRecommendationRequestDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const userId = GroupChatsController.getUserId(request);
      const routeParams = GroupChatsController.parseOrThrow(
        GroupChatChatIdParamsSchema,
        request.params,
      );
      const bodyDto = GroupChatsController.parseOrThrow(
        GroupChatRecommendationRequestDTOSchema,
        request.body,
      );
      const groupId = routeParams.groupId;
      const chatId = routeParams.chatId;
      const query = bodyDto.query;

      Logger.info("Requesting group chat recommendation", {
        userId,
        groupId,
        chatId,
      });

      const recommendationResult =
        await params.recommendInGroupChatUseCase.execute(
          userId,
          groupId,
          chatId,
          query,
        );
      const movies = recommendationResult.movies;
      const responseText = recommendationResult.response;
      const responseBody = await movieRecommendationResponseMapper.toResponse(
        movies,
        responseText,
      );

      Logger.debug("Group chat recommendation returned via HTTP", {
        userId,
        groupId,
        chatId,
        movieCount: movies.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static getUserId(request: FastifyRequest): number {
    const auth = request.userMovieEntryAuth;

    if (!auth) {
      throw new GroupChatValidationException(
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

    throw new GroupChatValidationException(message);
  }
}
