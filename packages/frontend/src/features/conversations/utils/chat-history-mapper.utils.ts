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

      const movies = tuple.length > 2 ? tuple[2] : undefined;
      const chatMessage = {
        from: role,
        message,
        ...(movies !== undefined ? { movies } : {}),
      };
      chat.push(chatMessage);
    }

    return chat;
  }
}
