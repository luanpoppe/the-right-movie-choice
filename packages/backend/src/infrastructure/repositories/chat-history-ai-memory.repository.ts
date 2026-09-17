import { AI } from "@luanpoppe/ai";
import {
  ChatHistoryEntity,
  ChatHistoryEntitySchema,
} from "@/core/entities/chat-history.entity";
import { IChatHistoryRepository } from "@/core/repositories/chat-history.repository";
import { Logger } from "@/lib/logger/logger";
import { ChatHistoryStructuredContentUtils } from "./chat-history-structured-content.utils";
import { ChatHistoryThreadIdUtils } from "./chat-history-thread-id.utils";

interface MemoryHistoryResult {
  messages: Array<{ role: string; content: string }>;
}

export class ChatHistoryAiMemoryRepository implements IChatHistoryRepository {
  constructor(private ai: AI) {}

  async getHistory(chatId: string): Promise<ChatHistoryEntity> {
    const historyResult = await this.resolveHistoryResult(chatId);
    const historyMessages = historyResult.messages;
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
        const messageText = parsedContent.message;
        const hasMessageText = messageText.trim().length > 0;
        const isEmptyAiPlaceholder = !hasMovies && !hasMessageText;
        if (isEmptyAiPlaceholder) {
          continue;
        }

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

  private async resolveHistoryResult(
    chatId: string,
  ): Promise<MemoryHistoryResult> {
    const memory = this.ai.memory;
    const candidateThreadIds =
      ChatHistoryThreadIdUtils.buildReadCandidateThreadIds(chatId);
    let fallbackResult: MemoryHistoryResult = { messages: [] };

    for (const threadId of candidateThreadIds) {
      const result = await memory.getHistory(threadId);
      const isBaseThread = threadId === chatId;
      if (isBaseThread) {
        fallbackResult = result;
      }

      const messageCount = result.messages.length;
      const hasMessages = messageCount > 0;
      if (!hasMessages) {
        continue;
      }

      const isDerivedThread = !isBaseThread;
      if (isDerivedThread) {
        Logger.debug("Resolved chat history from derived thread", {
          chatId,
          resolvedThreadId: threadId,
          messageCount,
        });
      }

      return result;
    }

    return fallbackResult;
  }
}
