import { BaseException } from "@/core/exceptions/base.exception";

export class UserConversationNotFoundException extends BaseException {
  statusCode = 404;

  constructor(conversationId: number) {
    super(`User conversation with id ${conversationId} not found`);
  }
}
