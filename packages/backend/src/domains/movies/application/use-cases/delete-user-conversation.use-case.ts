import { Logger } from "@/lib/logger/logger";
import { UserConversationDeleteAfterPurgeFailedException } from "../../domain/exceptions/user-conversation-delete-after-purge-failed.exception";
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
    // Purge primeiro: EC-03 exige que metadados não sumam se o checkpointer falhar.
    await this.chatThreadRepository.deleteThread(chatId);

    const deleted = await this.userConversationRepository.deleteById(
      userId,
      id,
    );

    if (!deleted) {
      Logger.error("User conversation metadata delete failed after thread purge", {
        userId,
        conversationId: id,
        chatId,
      });
      throw new UserConversationDeleteAfterPurgeFailedException(id, chatId);
    }

    Logger.info("User conversation deleted", {
      userId,
      conversationId: id,
      chatId,
    });
  }
}
