import { BaseException } from "@/core/exceptions/base.exception";

export class GroupChatDeleteAfterPurgeFailedException extends BaseException {
  statusCode = 500;

  constructor(groupChatId: number, chatId: string) {
    super(
      `Failed to delete group chat metadata after purging chat thread for group chat ${groupChatId} (chatId ${chatId})`,
    );
  }
}
