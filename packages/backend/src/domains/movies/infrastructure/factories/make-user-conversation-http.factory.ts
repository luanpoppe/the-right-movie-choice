import { AI } from "@luanpoppe/ai";
import { AiConfigBuilder } from "@/lib/ai/ai-config.builder";
import { MovieRecommendationPostgresMemory } from "@/lib/ai/movie-recommendation-postgres-memory";
import { ChatHistoryAiMemoryRepository } from "@/infrastructure/repositories/chat-history-ai-memory.repository";
import { PostgresChatThreadRepository } from "@/infrastructure/repositories/postgres-chat-thread.repository";
import { JoseAccessTokenProvider } from "@/modules/auth/infrastructure/providers/jose-access-token.provider";
import { CreateUserConversationUseCase } from "@/domains/movies/application/use-cases/create-user-conversation.use-case";
import { DeleteUserConversationUseCase } from "@/domains/movies/application/use-cases/delete-user-conversation.use-case";
import { GetUserConversationUseCase } from "@/domains/movies/application/use-cases/get-user-conversation.use-case";
import { ListUserConversationsUseCase } from "@/domains/movies/application/use-cases/list-user-conversations.use-case";
import { UpdateUserConversationTitleUseCase } from "@/domains/movies/application/use-cases/update-user-conversation-title.use-case";
import { UserConversationController } from "../http/controllers/user-conversation.controller";
import { UserMovieEntryAuthHook } from "../http/hooks/user-movie-entry-auth.hook";
import { PrismaMovieCatalogRepository } from "../repositories/movie-catalog/prisma-movie-catalog.repository";
import { PrismaUserConversationRepository } from "../repositories/user-conversation/prisma-user-conversation.repository";

export class MakeUserConversationHttpFactory {
  static create() {
    const accessTokenProvider = new JoseAccessTokenProvider();
    const userConversationRepository = new PrismaUserConversationRepository();
    const catalogRepository = new PrismaMovieCatalogRepository();
    const chatThreadRepository = new PostgresChatThreadRepository();

    const sharedPostgresMemory = MovieRecommendationPostgresMemory.getShared();
    const aiConfig = {
      ...AiConfigBuilder.buildFromEnv(),
      memory: sharedPostgresMemory,
    };
    const ai = new AI(aiConfig);
    const chatHistoryRepository = new ChatHistoryAiMemoryRepository(ai);

    const createUserConversationUseCase = new CreateUserConversationUseCase(
      userConversationRepository,
    );
    const listUserConversationsUseCase = new ListUserConversationsUseCase(
      userConversationRepository,
    );
    const getUserConversationUseCase = new GetUserConversationUseCase(
      userConversationRepository,
      chatHistoryRepository,
      catalogRepository,
    );
    const updateUserConversationTitleUseCase =
      new UpdateUserConversationTitleUseCase(userConversationRepository);
    const deleteUserConversationUseCase = new DeleteUserConversationUseCase(
      userConversationRepository,
      chatThreadRepository,
    );

    const preHandler = UserMovieEntryAuthHook.createPreHandler({
      accessTokenProvider,
    });
    const handlers = UserConversationController.create({
      createUserConversationUseCase,
      listUserConversationsUseCase,
      getUserConversationUseCase,
      updateUserConversationTitleUseCase,
      deleteUserConversationUseCase,
    });

    return { preHandler, handlers };
  }
}
