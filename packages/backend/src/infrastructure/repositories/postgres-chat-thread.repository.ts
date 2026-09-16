import type { IChatThreadRepository } from "@/domains/movies/domain/repositories/chat-thread.repository";
import { UserConversationValidationUtils } from "@/domains/movies/domain/user-conversation-validation.utils";
import { MovieRecommendationPostgresMemory } from "@/lib/ai/movie-recommendation-postgres-memory";
import { Logger } from "@/lib/logger/logger";
import { ErrorUtils } from "@/shared/utils/error.utils";

interface PostgresCheckpointerWithDeleteThread {
  deleteThread(threadId: string): Promise<void>;
}

export class PostgresChatThreadRepository implements IChatThreadRepository {
  async deleteThread(chatId: string): Promise<void> {
    UserConversationValidationUtils.assertValidChatId(chatId);

    Logger.debug("Deleting chat thread from checkpointer", { chatId });

    const memory = MovieRecommendationPostgresMemory.getShared();
    const checkpointer = await memory.getCheckpointer();
    const postgresSaver = checkpointer as PostgresCheckpointerWithDeleteThread;

    try {
      await postgresSaver.deleteThread(chatId);
    } catch (error) {
      const reason = ErrorUtils.message(error);
      Logger.error("Failed to delete chat thread from checkpointer", {
        chatId,
        reason,
      });
      throw error;
    }

    Logger.info("Chat thread deleted from checkpointer", { chatId });
  }
}
