import { ChatHistoryEntity } from "./../entities/chat-history.entity";
import { IChatHistoryRepository } from "./chat-history.repository";
import { Redis } from "@/lib/redis/redis";
import { ChatHistoryEntitySchema } from "@/entities/chat-history.entity";

export class ChatHistoryRedisRepository implements IChatHistoryRepository {
  constructor(private redis: Redis) {}

  async addMessage(
    newMessage: ChatHistoryEntity,
    chatId: string,
    expirationInSeconds: number
  ) {
    const currentValue = await this.redis.get(chatId);
    const currentValueParsed = ChatHistoryEntitySchema.parse(currentValue);
    currentValueParsed.push(...newMessage);

    await this.redis.setWithExpiration(
      chatId,
      currentValueParsed,
      expirationInSeconds
    );

    return currentValueParsed;
  }

  async getHistory(chatId: string) {
    const currentValue = await this.redis.get(chatId);
    const value = ChatHistoryEntitySchema.parse(currentValue);

    return value;
  }
}
