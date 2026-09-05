import {
  ChatHistoryEntitySchema,
} from "@/core/entities/chat-history.entity";
import { IChatHistoryRepository } from "../../core/repositories/chat-history.repository";
import { Redis } from "@/lib/redis/redis";

export class ChatHistoryRedisRepository implements IChatHistoryRepository {
  constructor(private redis: Redis) {}

  async getHistory(chatId: string) {
    const currentValue = await this.redis.get(chatId);
    const value = ChatHistoryEntitySchema.parse(currentValue);

    return value;
  }
}
