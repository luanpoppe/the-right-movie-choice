import type { UserConversation as PrismaUserConversation } from "../../../../../generated/prisma/client.js";
import type { UserConversationEntity } from "../../domain/entities/user-conversation.entity";

export class UserConversationPrismaMapper {
  static toEntity(row: PrismaUserConversation): UserConversationEntity {
    return {
      id: row.id,
      userId: row.userId,
      chatId: row.chatId,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
