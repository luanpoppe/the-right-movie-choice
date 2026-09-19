import { AI } from "@luanpoppe/ai";
import { MakeGetMovieRecommendationUseCaseFactory } from "@/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory";
import { PrismaMovieCatalogRepository } from "@/domains/movies/infrastructure/repositories/movie-catalog/prisma-movie-catalog.repository";
import { UserMovieEntryAuthHook } from "@/domains/movies/infrastructure/http/hooks/user-movie-entry-auth.hook";
import { ChatHistoryAiMemoryRepository } from "@/infrastructure/repositories/chat-history-ai-memory.repository";
import { PostgresChatThreadRepository } from "@/infrastructure/repositories/postgres-chat-thread.repository";
import { AiConfigBuilder } from "@/lib/ai/ai-config.builder";
import { MovieRecommendationPostgresMemory } from "@/lib/ai/movie-recommendation-postgres-memory";
import { JoseAccessTokenProvider } from "@/modules/auth/infrastructure/providers/jose-access-token.provider";
import { CreateGroupChatUseCase } from "@/modules/social/application/use-cases/create-group-chat.use-case";
import { DeleteGroupChatUseCase } from "@/modules/social/application/use-cases/delete-group-chat.use-case";
import { GetGroupChatUseCase } from "@/modules/social/application/use-cases/get-group-chat.use-case";
import { ListGroupChatsUseCase } from "@/modules/social/application/use-cases/list-group-chats.use-case";
import { RecommendInGroupChatUseCase } from "@/modules/social/application/use-cases/recommend-in-group-chat.use-case";
import { UpdateGroupChatFilterMembersUseCase } from "@/modules/social/application/use-cases/update-group-chat-filter-members.use-case";
import { UpdateGroupChatTitleUseCase } from "@/modules/social/application/use-cases/update-group-chat-title.use-case";
import { GroupChatsController } from "../http/controllers/group-chats.controller";
import { PrismaGroupChatRepository } from "../repositories/group-chat/prisma-group-chat.repository";
import { PrismaUserGroupRepository } from "../repositories/user-group/prisma-user-group.repository";

export class MakeGroupChatsHttpFactory {
  static create() {
    const accessTokenProvider = new JoseAccessTokenProvider();
    const userGroupRepository = new PrismaUserGroupRepository();
    const groupChatRepository = new PrismaGroupChatRepository();
    const catalogRepository = new PrismaMovieCatalogRepository();
    const chatThreadRepository = new PostgresChatThreadRepository();

    const sharedPostgresMemory = MovieRecommendationPostgresMemory.getShared();
    const aiConfig = {
      ...AiConfigBuilder.buildFromEnv(),
      memory: sharedPostgresMemory,
    };
    const ai = new AI(aiConfig);
    const chatHistoryRepository = new ChatHistoryAiMemoryRepository(ai);

    const createGroupChatUseCase = new CreateGroupChatUseCase(
      userGroupRepository,
      groupChatRepository,
    );
    const listGroupChatsUseCase = new ListGroupChatsUseCase(
      userGroupRepository,
      groupChatRepository,
    );
    const getGroupChatUseCase = new GetGroupChatUseCase(
      userGroupRepository,
      groupChatRepository,
      chatHistoryRepository,
      catalogRepository,
    );
    const updateGroupChatTitleUseCase = new UpdateGroupChatTitleUseCase(
      userGroupRepository,
      groupChatRepository,
    );
    const deleteGroupChatUseCase = new DeleteGroupChatUseCase(
      userGroupRepository,
      groupChatRepository,
      chatThreadRepository,
    );
    const updateGroupChatFilterMembersUseCase =
      new UpdateGroupChatFilterMembersUseCase(
        userGroupRepository,
        groupChatRepository,
      );

    const conversationTitleGenerator =
      MakeGetMovieRecommendationUseCaseFactory.createConversationTitleGenerator();
    const recommendInGroupChatUseCase = new RecommendInGroupChatUseCase(
      userGroupRepository,
      groupChatRepository,
      MakeGetMovieRecommendationUseCaseFactory.create,
      conversationTitleGenerator,
    );

    const preHandler = UserMovieEntryAuthHook.createPreHandler({
      accessTokenProvider,
    });
    const handlers = GroupChatsController.create({
      createGroupChatUseCase,
      listGroupChatsUseCase,
      getGroupChatUseCase,
      updateGroupChatTitleUseCase,
      deleteGroupChatUseCase,
      updateGroupChatFilterMembersUseCase,
      recommendInGroupChatUseCase,
      catalogRepository,
    });

    return { preHandler, handlers };
  }
}
