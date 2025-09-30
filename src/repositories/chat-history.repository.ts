import {
  ChatHistoryEntity,
  ChatHistoryEntityTuple,
} from "@/entities/chat-history.entity";
import z from "zod";

export interface IChatHistoryRepository {
  addMessage(
    newMessage: z.infer<typeof ChatHistoryEntityTuple>[],
    chatId: string
  ): Promise<ChatHistoryEntity>;

  getHistory(chatId: string): Promise<ChatHistoryEntity>;
}
