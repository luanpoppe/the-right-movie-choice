import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { IChatHistoryRepository } from "@/core/repositories/chat-history.repository";
import { ChatHistoryCatalogEnrichmentUtils } from "@/infrastructure/repositories/chat-history-catalog-enrichment.utils";
import { Logger } from "@/lib/logger/logger";
import type { UserConversationEntity } from "../../domain/entities/user-conversation.entity";
import { UserConversationNotFoundException } from "../../domain/exceptions/user-conversation-not-found.exception";
import type { IMovieCatalogRepository } from "../../domain/repositories/movie-catalog.repository";
import type { IUserConversationRepository } from "../../domain/repositories/user-conversation.repository";

export type GetUserConversationResult = {
  conversation: UserConversationEntity;
  messages: ChatHistoryEntity;
};

export class GetUserConversationUseCase {
  constructor(
    private userConversationRepository: IUserConversationRepository,
    private chatHistoryRepository: IChatHistoryRepository,
    private catalogRepository: IMovieCatalogRepository,
  ) {}

  async execute(
    userId: number,
    id: number,
  ): Promise<GetUserConversationResult> {
    const conversation = await this.userConversationRepository.findById(
      userId,
      id,
    );

    if (!conversation) {
      Logger.debug("User conversation not found", {
        userId,
        conversationId: id,
      });
      throw new UserConversationNotFoundException(id);
    }

    const chatId = conversation.chatId;
    const rawMessages = await this.chatHistoryRepository.getHistory(chatId);
    const messages = await ChatHistoryCatalogEnrichmentUtils.enrichMoviePosters(
      rawMessages,
      this.catalogRepository,
    );

    Logger.debug("User conversation retrieved", {
      userId,
      conversationId: id,
      chatId,
      messageCount: messages.length,
    });

    return { conversation, messages };
  }
}
