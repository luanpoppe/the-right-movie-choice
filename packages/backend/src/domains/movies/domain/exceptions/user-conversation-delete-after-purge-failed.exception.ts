import { BaseException } from "@/core/exceptions/base.exception";

export class UserConversationDeleteAfterPurgeFailedException extends BaseException {
  statusCode = 500;

  constructor(conversationId: number, chatId: string) {
    super(
      `Failed to delete user conversation metadata after purging chat thread for conversation ${conversationId} (chatId ${chatId})`,
    );
  }
}
