import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { IChatHistoryRepository } from "@/core/repositories/chat-history.repository";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { ChatHistoryCatalogEnrichmentUtils } from "@/infrastructure/repositories/chat-history-catalog-enrichment.utils";
import { Logger } from "@/lib/logger/logger";
import type { GroupChatEntity } from "../../domain/entities/group-chat.entity";
import { GroupChatNotFoundException } from "../../domain/exceptions/group-chat-not-found.exception";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import { GroupChatValidationUtils } from "../../domain/group-chat-validation.utils";
import type { IGroupChatRepository } from "../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export type GetGroupChatResult = {
  chat: GroupChatEntity;
  messages: ChatHistoryEntity;
};

export class GetGroupChatUseCase {
  constructor(
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly groupChatRepository: IGroupChatRepository,
    private readonly chatHistoryRepository: IChatHistoryRepository,
    private readonly catalogRepository: IMovieCatalogRepository,
  ) {}

  async execute(
    userId: number,
    groupId: number,
    chatId: string,
  ): Promise<GetGroupChatResult> {
    UserGroupValidationUtils.assertValidUserId(userId);
    UserGroupValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidChatId(chatId);

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
      Logger.debug("Group chat not found by chatId", {
        groupId,
        userId,
        chatId,
      });
      throw new GroupChatNotFoundException(0);
    }

    const historyChatId = chat.chatId;
    const rawMessages =
      await this.chatHistoryRepository.getHistory(historyChatId);
    const messages = await ChatHistoryCatalogEnrichmentUtils.enrichMoviePosters(
      rawMessages,
      this.catalogRepository,
    );

    Logger.debug("Group chat retrieved", {
      groupId,
      userId,
      groupChatId: chat.id,
      chatId: historyChatId,
      messageCount: messages.length,
    });

    return { chat, messages };
  }
}
