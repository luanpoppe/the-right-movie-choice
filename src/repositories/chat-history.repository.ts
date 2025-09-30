import { ChatHistoryEntity } from "@/entities/chat-history.entity";

export interface IChatHistoryRepository {
  addMessage(
    newMessage: ChatHistoryEntity,
    chatId: string
  ): Promise<ChatHistoryEntity>;

  getHistory(chatId: string): Promise<ChatHistoryEntity>;
}
