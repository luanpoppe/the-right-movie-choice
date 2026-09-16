import { AI } from "@luanpoppe/ai";
import { env } from "@/env";
import { AiConfigBuilder } from "@/lib/ai/ai-config.builder";
import { MovieRecommendationPostgresMemory } from "@/lib/ai/movie-recommendation-postgres-memory";
import { Logger } from "@/lib/logger/logger";
import { Redis } from "@/lib/redis/redis";
import { MakeTmdbHttpClientFactory } from "@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import {
  GetMovieRecommendationUseCase,
  GetMovieRecommendationUseCaseOptions,
} from "../../application/use-cases/get-movie-recommendation.use-case";
import { PrismaMovieCatalogRepository } from "../repositories/movie-catalog/prisma-movie-catalog.repository";
import { PrismaUserMovieEntryRepository } from "../repositories/user-movie-entry/prisma-user-movie-entry.repository";
import { AiMovieRecommendationProvider } from "../providers/ai-movie-recommendation.provider";
import { MovieCatalogDetailsResolver } from "../providers/movie-catalog-details.resolver";
import {
  MovieCatalogLookupAiTool,
  MovieCatalogLookupAiToolOptions,
} from "../providers/movie-catalog-lookup.ai-tool";
import { MovieCatalogLookupService } from "../providers/movie-catalog-lookup.service";
import { CatalogPersistEnqueuer } from "../workers/catalog-persist.enqueuer";
import { PrismaUserConversationRepository } from "../repositories/user-conversation/prisma-user-conversation.repository";
import { ConversationTitleGenerator } from "../providers/conversation-title.generator";
import type { IUserConversationRepository } from "../../domain/repositories/user-conversation.repository";

type AiConstructorConfig = ConstructorParameters<typeof AI>[0];

const CHAT_MEMORY_TTL_SECONDS = 1200;

export class MakeGetMovieRecommendationUseCaseFactory {
  static createUserConversationRepository(): IUserConversationRepository {
    return new PrismaUserConversationRepository();
  }

  static createConversationTitleGenerator(): ConversationTitleGenerator {
    const config = AiConfigBuilder.buildFromEnv();
    const ai = new AI(config);
    return new ConversationTitleGenerator(ai);
  }

  static create(options?: GetMovieRecommendationUseCaseOptions) {
    const config =
      MakeGetMovieRecommendationUseCaseFactory.buildAiConfig(options);
    const ai = new AI(config);

    const catalog = MakeTmdbHttpClientFactory.create();
    const redis = new Redis();
    const cache = new TmdbMovieDetailsCache(redis);
    const repo = new PrismaMovieCatalogRepository();
    const userMovieEntryRepository = new PrismaUserMovieEntryRepository();
    const enqueuePersist = CatalogPersistEnqueuer.enqueue;
    const resolver = new MovieCatalogDetailsResolver(
      cache,
      repo,
      catalog,
      enqueuePersist,
    );
    const catalogLookup = new MovieCatalogLookupService(
      catalog,
      repo,
      cache,
      resolver,
    );
    const lookupToolOptions =
      MakeGetMovieRecommendationUseCaseFactory.buildLookupToolOptions(
        options,
        userMovieEntryRepository,
      );
    const lookupMoviesAiTool = new MovieCatalogLookupAiTool(
      catalogLookup,
      lookupToolOptions,
    );
    const lookupMoviesTool = lookupMoviesAiTool.createLookupMoviesTool();
    const movieRecommendationProvider = new AiMovieRecommendationProvider({
      ai,
      lookupMoviesTool,
    });

    const useCase = new GetMovieRecommendationUseCase(
      movieRecommendationProvider,
      userMovieEntryRepository,
    );
    return useCase;
  }

  private static buildLookupToolOptions(
    options?: GetMovieRecommendationUseCaseOptions,
    userMovieEntryRepository?: PrismaUserMovieEntryRepository,
  ): MovieCatalogLookupAiToolOptions | undefined {
    const excludeWatched = options?.excludeWatched === true;
    const userId = options?.userId;
    const hasValidUserId = userId !== undefined && userId > 0;
    const isExcludeMode = excludeWatched && hasValidUserId;

    if (!isExcludeMode) {
      return undefined;
    }

    if (!userMovieEntryRepository) {
      return undefined;
    }

    return {
      userId,
      excludeWatched: true,
      userMovieEntryRepository,
    };
  }

  private static buildAiConfig(
    options?: GetMovieRecommendationUseCaseOptions,
  ): AiConstructorConfig {
    const userId = options?.userId;
    const hasValidUserId = userId !== undefined && userId > 0;

    if (hasValidUserId) {
      const sharedPostgresMemory = MovieRecommendationPostgresMemory.getShared();
      Logger.debug(
        "Movie recommendation AI memory backend selected: postgres",
        { userId },
      );

      return {
        ...AiConfigBuilder.buildFromEnv(),
        memory: sharedPostgresMemory,
      };
    }

    const redisUrl = env.REDIS_URL;
    const checkpointerRedisUrl =
      MakeGetMovieRecommendationUseCaseFactory.toCheckpointerRedisUrl(
        redisUrl,
      );
    Logger.debug("Movie recommendation AI memory backend selected: redis", {
      defaultTTL: CHAT_MEMORY_TTL_SECONDS,
      refreshOnRead: true,
    });

    return {
      ...AiConfigBuilder.buildFromEnv(),
      memory: {
        type: "redis",
        url: checkpointerRedisUrl,
        options: {
          defaultTTL: CHAT_MEMORY_TTL_SECONDS,
          refreshOnRead: true,
        },
      },
    };
  }

  private static toCheckpointerRedisUrl(redisUrl: string): string {
    const hasProtocol = redisUrl.includes("://");
    if (hasProtocol) return redisUrl;

    const checkpointerRedisUrl = `redis://${redisUrl}`;
    Logger.debug("Prefixed redis:// for LangGraph checkpointer", {
      envHasProtocol: false,
    });
    return checkpointerRedisUrl;
  }
}
