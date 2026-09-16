import { BaseException } from "@/core/exceptions/base.exception";

export class UserConversationChatIdConflictException extends BaseException {
  statusCode = 409;

  constructor(chatId: string) {
    super(`User conversation with chatId "${chatId}" already exists`);
  }
}
