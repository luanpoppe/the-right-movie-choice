import { Logger } from "@/lib/logger/logger";
import type { UserConversationEntity } from "../../domain/entities/user-conversation.entity";
import type { IUserConversationRepository } from "../../domain/repositories/user-conversation.repository";

export class ListUserConversationsUseCase {
  constructor(
    private userConversationRepository: IUserConversationRepository,
  ) {}

  async execute(userId: number): Promise<UserConversationEntity[]> {
    const conversations =
      await this.userConversationRepository.listByUserId(userId);

    Logger.debug("User conversations listed", {
      userId,
      count: conversations.length,
    });

    return conversations;
  }
}
