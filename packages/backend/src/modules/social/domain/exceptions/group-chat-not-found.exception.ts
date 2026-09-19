import { BaseException } from "@/core/exceptions/base.exception";

export class GroupChatNotFoundException extends BaseException {
  statusCode = 404;

  constructor(chatId: number) {
    super(`Group chat with id ${chatId} not found`);
  }
}
