import { ChatHistoryEntityTuple } from "./../entities/chat-history.entity";
import { IChatHistoryRepository } from "./chat-history.repository";
import { Redis } from "@/lib/redis/redis";
import { ChatHistoryEntitySchema } from "@/entities/chat-history.entity";
import z from "zod";

export class ChatHistoryRedisRepository implements IChatHistoryRepository {
  constructor(private redis: Redis) {}

  async addMessage(
    newMessage: z.infer<typeof ChatHistoryEntityTuple>[],
    chatId: string
  ) {
    const currentValue = await this.redis.get(chatId);
    const currentValueParsed = ChatHistoryEntitySchema.parse(currentValue);
    currentValueParsed.push(...newMessage);

    await this.redis.set(chatId, currentValueParsed);

    return { chatHistory: currentValueParsed };
  }

  async getHistory(chatId: string) {
    const currentValue = await this.redis.get(chatId);
    const value = ChatHistoryEntitySchema.parse(currentValue);

    return { chatHistory: value };
  }
}
