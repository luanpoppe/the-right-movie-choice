import { Logger } from "@/lib/logger/logger";
import { UserConversationNotFoundException } from "../../domain/exceptions/user-conversation-not-found.exception";
import type { IChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import type { IUserConversationRepository } from "../../domain/repositories/user-conversation.repository";

export class DeleteUserConversationUseCase {
  constructor(
    private userConversationRepository: IUserConversationRepository,
    private chatThreadRepository: IChatThreadRepository,
  ) {}

  async execute(userId: number, id: number): Promise<void> {
    const conversation = await this.userConversationRepository.findById(
      userId,
      id,
    );

    if (!conversation) {
      Logger.debug("User conversation not found for delete", {
        userId,
        conversationId: id,
      });
      throw new UserConversationNotFoundException(id);
    }

    const chatId = conversation.chatId;
    await this.chatThreadRepository.deleteThread(chatId);

    const deleted = await this.userConversationRepository.deleteById(
      userId,
      id,
    );

    if (!deleted) {
      Logger.debug("User conversation not found during delete after purge", {
        userId,
        conversationId: id,
        chatId,
      });
      throw new UserConversationNotFoundException(id);
    }

    Logger.info("User conversation deleted", {
      userId,
      conversationId: id,
      chatId,
    });
  }
}
