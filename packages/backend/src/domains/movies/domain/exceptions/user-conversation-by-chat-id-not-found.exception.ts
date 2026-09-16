import { BaseException } from "@/core/exceptions/base.exception";

export class UserConversationByChatIdNotFoundException extends BaseException {
  statusCode = 404;

  constructor(chatId: string) {
    super(`User conversation with chatId ${chatId} not found`);
  }
}
