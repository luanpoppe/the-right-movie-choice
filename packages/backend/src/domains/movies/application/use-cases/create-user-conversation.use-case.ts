import { randomUUID } from "node:crypto";
import { Logger } from "@/lib/logger/logger";
import type { UserConversationEntity } from "../../domain/entities/user-conversation.entity";
import type { IUserConversationRepository } from "../../domain/repositories/user-conversation.repository";

export class CreateUserConversationUseCase {
  constructor(
    private userConversationRepository: IUserConversationRepository,
  ) {}

  async execute(userId: number): Promise<UserConversationEntity> {
    const chatId = randomUUID();

    const conversation = await this.userConversationRepository.create({
      userId,
      chatId,
      title: null,
    });

    Logger.info("User conversation created", {
      userId,
      chatId,
      conversationId: conversation.id,
    });

    return conversation;
  }
}
