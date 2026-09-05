import { ChatHistoryEntity } from "../entities/chat-history.entity";

export interface IChatHistoryRepository {
  getHistory(chatId: string): Promise<ChatHistoryEntity>;
}
