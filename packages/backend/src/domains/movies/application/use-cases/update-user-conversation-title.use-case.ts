import { Logger } from "@/lib/logger/logger";
import type { UserConversationEntity } from "../../domain/entities/user-conversation.entity";
import { UserConversationNotFoundException } from "../../domain/exceptions/user-conversation-not-found.exception";
import type { IUserConversationRepository } from "../../domain/repositories/user-conversation.repository";
import { UserConversationValidationUtils } from "../../domain/user-conversation-validation.utils";

export class UpdateUserConversationTitleUseCase {
  constructor(
    private userConversationRepository: IUserConversationRepository,
  ) {}

  async execute(
    userId: number,
    id: number,
    title: string,
  ): Promise<UserConversationEntity> {
    UserConversationValidationUtils.assertValidTitle(title);

    const updatedConversation =
      await this.userConversationRepository.updateTitle(userId, id, title);

    if (!updatedConversation) {
      Logger.debug("User conversation not found for title update", {
        userId,
        conversationId: id,
      });
      throw new UserConversationNotFoundException(id);
    }

    Logger.info("User conversation title updated", {
      userId,
      conversationId: id,
    });

    return updatedConversation;
  }
}
