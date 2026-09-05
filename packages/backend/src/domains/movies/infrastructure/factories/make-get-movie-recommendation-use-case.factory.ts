import { AI } from "@luanpoppe/ai";
import { env } from "@/env";
import { AiModels } from "@/lib/ai/ai-models";
import { Logger } from "@/lib/logger/logger";
import { Redis } from "@/lib/redis/redis";
import { MakeTmdbHttpClientFactory } from "@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import { StringUtils } from "@/shared/utils/string.utils";

import { GetMovieRecommendationUseCase } from "../../application/use-cases/get-movie-recommendation.use-case";
import { PrismaMovieCatalogRepository } from "../repositories/movie-catalog/prisma-movie-catalog.repository";
import { AiMovieRecommendationProvider } from "../providers/ai-movie-recommendation.provider";
import { MovieCatalogDetailsResolver } from "../providers/movie-catalog-details.resolver";
import { MovieCatalogLookupAiTool } from "../providers/movie-catalog-lookup.ai-tool";
import { MovieCatalogLookupService } from "../providers/movie-catalog-lookup.service";

type AiConstructorConfig = ConstructorParameters<typeof AI>[0];

const CHAT_MEMORY_TTL_SECONDS = 1200;

export class MakeGetMovieRecommendationUseCaseFactory {
  static create() {
    const config = MakeGetMovieRecommendationUseCaseFactory.buildAiConfig();
    const ai = new AI(config);

    const catalog = MakeTmdbHttpClientFactory.create();
    const redis = new Redis();
    const cache = new TmdbMovieDetailsCache(redis);
    const repo = new PrismaMovieCatalogRepository();
    const resolver = new MovieCatalogDetailsResolver(cache, repo, catalog);
    const catalogLookup = new MovieCatalogLookupService(
      catalog,
      repo,
      cache,
      resolver,
    );
    const lookupMoviesAiTool = new MovieCatalogLookupAiTool(catalogLookup);
    const lookupMoviesTool = lookupMoviesAiTool.createLookupMoviesTool();
    const movieRecommendationProvider = new AiMovieRecommendationProvider({
      ai,
      lookupMoviesTool,
    });

    const useCase = new GetMovieRecommendationUseCase(
      movieRecommendationProvider,
    );
    return useCase;
  }

  private static buildAiConfig(): AiConstructorConfig {
    const openRouterApiKey = env.OPENROUTER_API_KEY;
    const geminiApiKey = env.GEMINI_API_KEY;
    const redisUrl = env.REDIS_URL;
    const checkpointerRedisUrl =
      MakeGetMovieRecommendationUseCaseFactory.toCheckpointerRedisUrl(
        redisUrl,
      );
    const hasOpenRouterApiKey = !StringUtils.isEmptyString(openRouterApiKey);
    const hasGeminiApiKey = !StringUtils.isEmptyString(geminiApiKey);

    return {
      ...(hasOpenRouterApiKey ? { openRouterApiKey } : {}),
      ...(hasGeminiApiKey
        ? {
            googleGeminiToken: geminiApiKey,
            aiModelsFallback: [AiModels.GEMINI_FALLBACK],
          }
        : {}),
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
