import { AI } from "@luanpoppe/ai";
import {
  ChatHistoryEntity,
  ChatHistoryEntitySchema,
} from "@/core/entities/chat-history.entity";
import { IChatHistoryRepository } from "@/core/repositories/chat-history.repository";
import { Logger } from "@/lib/logger/logger";
import { ChatHistoryStructuredContentUtils } from "./chat-history-structured-content.utils";

export class ChatHistoryAiMemoryRepository implements IChatHistoryRepository {
  constructor(private ai: AI) {}

  async getHistory(chatId: string): Promise<ChatHistoryEntity> {
    const memory = this.ai.memory;
    const result = await memory.getHistory(chatId);
    const historyMessages = result.messages;
    const mappedTuples: ChatHistoryEntity = [];

    for (const message of historyMessages) {
      const role = message.role;
      const content = message.content;
      const isToolMessage = role === "tool";
      if (isToolMessage) {
        continue;
      }

      if (role === "human") {
        mappedTuples.push(["user", content]);
        continue;
      }

      if (role === "ai") {
        const parsedContent =
          ChatHistoryStructuredContentUtils.parseAiContent(content);
        const movies = parsedContent.movies;
        const hasMovies = movies !== undefined && movies.length > 0;
        if (hasMovies) {
          const aiMessageWithMovies: ["ai", string, Record<string, unknown>[]] =
            ["ai", parsedContent.message, movies];
          mappedTuples.push(aiMessageWithMovies);
          continue;
        }

        mappedTuples.push(["ai", parsedContent.message]);
        continue;
      }

      Logger.error("Unknown chat history memory role", { chatId, role });
      throw new Error(`Unknown chat history memory role: ${role}`);
    }

    const parsedHistory = ChatHistoryEntitySchema.parse(mappedTuples);
    return parsedHistory;
  }
}
