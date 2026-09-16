import { ChatEntity } from "@/features/chat/entities/chat.entity";
import { ChatHistoryEntity } from "../dto/user-conversation.dto";

export class ChatHistoryMapperUtils {
  static toChatEntity(history: ChatHistoryEntity): ChatEntity {
    const chat: ChatEntity = [];

    for (const tuple of history) {
      const role = tuple[0];
      const message = tuple[1];

      if (role === "system") {
        continue;
      }

      const chatMessage = {
        from: role,
        message,
      };
      chat.push(chatMessage);
    }

    return chat;
  }
}
