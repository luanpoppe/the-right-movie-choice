import type { GroupChat as PrismaGroupChat } from "../../../../../generated/prisma/client.js";
import type { GroupChatEntity } from "../../domain/entities/group-chat.entity";

export class GroupChatPrismaMapper {
  static toEntity(row: PrismaGroupChat): GroupChatEntity {
    return {
      id: row.id,
      groupId: row.groupId,
      chatId: row.chatId,
      title: row.title,
      filterMemberUserIds: row.filterMemberUserIds,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
