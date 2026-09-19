import {
  GetMovieRecommendationUseCase,
  GetMovieRecommendationUseCaseOptions,
} from "@/domains/movies/application/use-cases/get-movie-recommendation.use-case";
import type { MovieRecommendationEntity } from "@/domains/movies/domain/entities/movie-recommendation.entity";
import { ConversationTitleGenerator } from "@/domains/movies/infrastructure/providers/conversation-title.generator";
import { Logger } from "@/lib/logger/logger";
import { StringUtils } from "@/shared/utils/string.utils";
import type { GroupChatEntity } from "../../domain/entities/group-chat.entity";
import { GroupChatNotFoundException } from "../../domain/exceptions/group-chat-not-found.exception";
import { GroupChatValidationException } from "../../domain/exceptions/group-chat-validation.exception";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import { GroupChatValidationUtils } from "../../domain/group-chat-validation.utils";
import type { IGroupChatRepository } from "../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export type RecommendInGroupChatResult = {
  movies: MovieRecommendationEntity["movies"];
  response: MovieRecommendationEntity["response"];
};

type RecommendationExecutionResult = RecommendInGroupChatResult & {
  generatedTitle: string | null;
};

export type CreateGetMovieRecommendationUseCase = (
  options: GetMovieRecommendationUseCaseOptions,
) => GetMovieRecommendationUseCase;

export class RecommendInGroupChatUseCase {
  constructor(
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly groupChatRepository: IGroupChatRepository,
    private readonly createGetMovieRecommendationUseCase: CreateGetMovieRecommendationUseCase,
    private readonly conversationTitleGenerator: ConversationTitleGenerator,
  ) {}

  async execute(
    userId: number,
    groupId: number,
    chatId: string,
    query: string,
  ): Promise<RecommendInGroupChatResult> {
    UserGroupValidationUtils.assertValidUserId(userId);
    UserGroupValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidChatId(chatId);
    RecommendInGroupChatUseCase.assertValidQuery(query);

    const group = await this.userGroupRepository.findById(groupId);

    if (!group) {
      throw new UserGroupNotFoundException(groupId);
    }

    const membership = await this.userGroupRepository.findMembership(
      groupId,
      userId,
    );

    if (!membership) {
      throw new NotGroupMemberException(groupId);
    }

    const chat = await this.groupChatRepository.findByChatId(groupId, chatId);

    if (!chat) {
      Logger.debug("Group chat not found for recommendation", {
        groupId,
        userId,
        chatId,
      });
      throw new GroupChatNotFoundException(0);
    }

    const historyChatId = chat.chatId;
    const touchedChat = await this.groupChatRepository.touchUpdatedAt(
      groupId,
      historyChatId,
    );

    if (!touchedChat) {
      Logger.debug("Group chat missing before recommendation turn", {
        groupId,
        userId,
        chatId: historyChatId,
        groupChatId: chat.id,
      });
      throw new GroupChatNotFoundException(chat.id);
    }

    const groupMemberUserIds =
      await this.userGroupRepository.findMemberUserIds(groupId);
    const filterUserIds =
      RecommendInGroupChatUseCase.intersectFilterMemberUserIds(
        chat.filterMemberUserIds,
        groupMemberUserIds,
      );
    const filterMemberCount = filterUserIds.length;

    const executionResult = await this.executeRecommendationWithOptionalTitle(
      chat,
      userId,
      query,
      filterUserIds,
    );

    await this.saveGeneratedTitleIfAny(
      groupId,
      chat,
      executionResult.generatedTitle,
    );

    Logger.info("Group chat recommendation completed", {
      groupId,
      userId,
      groupChatId: chat.id,
      chatId: historyChatId,
      filterMemberCount,
    });

    return {
      movies: executionResult.movies,
      response: executionResult.response,
    };
  }

  private async executeRecommendationWithOptionalTitle(
    chat: GroupChatEntity,
    userId: number,
    query: string,
    filterUserIds: number[],
  ): Promise<RecommendationExecutionResult> {
    const recommendationOptions = {
      userId,
      excludeWatched: true,
      filterUserIds,
    };
    const getMovieRecommendationUseCase =
      this.createGetMovieRecommendationUseCase(recommendationOptions);
    const historyChatId = chat.chatId;
    const shouldGenerateTitle = chat.title === null;

    if (!shouldGenerateTitle) {
      const recommendationResult =
        await getMovieRecommendationUseCase.execute(
          query,
          historyChatId,
          recommendationOptions,
        );

      return {
        movies: recommendationResult.movies,
        response: recommendationResult.response,
        generatedTitle: null,
      };
    }

    const executePromise = getMovieRecommendationUseCase.execute(
      query,
      historyChatId,
      recommendationOptions,
    );
    const titlePromise =
      this.conversationTitleGenerator.generateFromUserMessage(query);

    const parallelResults = await Promise.all([executePromise, titlePromise]);
    const recommendationResult = parallelResults[0];
    const generatedTitle = parallelResults[1];

    return {
      movies: recommendationResult.movies,
      response: recommendationResult.response,
      generatedTitle,
    };
  }

  private async saveGeneratedTitleIfAny(
    groupId: number,
    chat: GroupChatEntity,
    generatedTitle: string | null,
  ): Promise<void> {
    if (generatedTitle === null) {
      return;
    }

    const groupChatId = chat.id;
    const updatedChat = await this.groupChatRepository.updateTitle(
      groupId,
      groupChatId,
      generatedTitle,
    );

    if (!updatedChat) {
      Logger.debug("Group chat title update skipped after recommendation", {
        groupId,
        groupChatId,
        chatId: chat.chatId,
      });
      return;
    }

    Logger.debug("Group chat title saved from recommendation turn", {
      groupId,
      groupChatId,
      chatId: chat.chatId,
    });
  }

  private static intersectFilterMemberUserIds(
    filterMemberUserIds: number[],
    groupMemberUserIds: number[],
  ): number[] {
    const groupMemberIdSet = new Set(groupMemberUserIds);
    const intersectedIds: number[] = [];

    for (const memberUserId of filterMemberUserIds) {
      const isCurrentGroupMember = groupMemberIdSet.has(memberUserId);
      if (!isCurrentGroupMember) {
        continue;
      }

      intersectedIds.push(memberUserId);
    }

    return intersectedIds;
  }

  private static assertValidQuery(query: string): void {
    const trimmedQuery = query.trim();
    const isEmptyQuery = StringUtils.isEmptyString(trimmedQuery);

    if (isEmptyQuery) {
      throw new GroupChatValidationException(
        "query must be a non-empty string",
      );
    }
  }
}
