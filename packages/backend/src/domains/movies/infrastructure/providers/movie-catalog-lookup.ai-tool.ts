import { AITools } from "@luanpoppe/ai";
import type { AICallParams } from "@luanpoppe/ai";
import z from "zod";
import type {
  MovieCatalogLookupInput,
  MovieCatalogLookupResult,
} from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import { ExcludeWatchedRecommendationConstants } from "@/domains/movies/domain/exclude-watched-recommendation.constants";
import type { IUserMovieEntryRepository } from "@/domains/movies/domain/repositories/user-movie-entry.repository";
import { WatchedMovieFilterUtils } from "@/domains/movies/domain/watched-movie-filter.utils";
import { Logger } from "@/lib/logger/logger";
import { StringUtils } from "@/shared/utils/string.utils";
import { MovieCatalogLookupService } from "./movie-catalog-lookup.service";

type LookupMoviesToolInput = {
  queries: Array<{
    query: string;
    year?: number | undefined;
    language?: string | undefined;
  }>;
};

type AgentTool = NonNullable<
  NonNullable<AICallParams["agent"]>["tools"]
>[number];

export type MovieCatalogLookupAiToolOptions = {
  userMovieEntryRepository?: IUserMovieEntryRepository | undefined;
  userId?: number | undefined;
  excludeWatched?: boolean | undefined;
};

export class MovieCatalogLookupAiTool {
  private static readonly MIN_QUERIES = 1;
  private static readonly TOOL_NAME = "lookupMovies";
  private static readonly TOOL_DESCRIPTION =
    "Uma chamada com várias queries de busca no catálogo de filmes; os lookups rodam em paralelo e os resultados mantêm a mesma ordem das queries (hits e misses). language opcional por query (ex.: pt-BR, en-US); omitido usa pt-BR.";

  private readonly aiTools = new AITools();
  private readonly excludeWatched: boolean;
  private readonly userId: number | undefined;
  private readonly userMovieEntryRepository:
    | IUserMovieEntryRepository
    | undefined;
  private readonly maxQueries: number;

  constructor(
    private readonly catalogLookup: MovieCatalogLookupService,
    options?: MovieCatalogLookupAiToolOptions,
  ) {
    this.excludeWatched = options?.excludeWatched === true;
    this.userId = options?.userId;
    this.userMovieEntryRepository = options?.userMovieEntryRepository;
    this.maxQueries = MovieCatalogLookupAiTool.resolveMaxQueries(
      this.excludeWatched,
      this.userId,
    );
  }

  createLookupMoviesTool(): AgentTool {
    const schema = MovieCatalogLookupAiTool.buildInputSchema(this.maxQueries);
    const catalogLookup = this.catalogLookup;
    const excludeWatched = this.excludeWatched;
    const userId = this.userId;
    const userMovieEntryRepository = this.userMovieEntryRepository;
    const toolFunction = async (
      input: LookupMoviesToolInput,
    ): Promise<MovieCatalogLookupResult[]> => {
      const startedAtMs = Date.now();
      const queryCount = input.queries.length;

      try {
        const lookupInputs = input.queries.map((queryItem) => {
          const lookupInput = MovieCatalogLookupAiTool.toLookupInput(queryItem);
          return lookupInput;
        });
        const lookupResults =
          await catalogLookup.findDetailsByTitlesBatch(lookupInputs);

        const filteredResults =
          await MovieCatalogLookupAiTool.applyWatchedFilterIfNeeded(
            lookupResults,
            excludeWatched,
            userId,
            userMovieEntryRepository,
          );

        const durationMs = Date.now() - startedAtMs;
        MovieCatalogLookupAiTool.logSuccess(durationMs, queryCount);

        return filteredResults;
      } catch (error) {
        const durationMs = Date.now() - startedAtMs;
        MovieCatalogLookupAiTool.logFailure(durationMs, queryCount, error);
        throw error;
      }
    };

    const structuredTool = this.aiTools.createTool({
      name: MovieCatalogLookupAiTool.TOOL_NAME,
      description: MovieCatalogLookupAiTool.TOOL_DESCRIPTION,
      schema: schema as never,
      toolFunction: toolFunction as never,
    });

    return structuredTool as AgentTool;
  }

  private static resolveMaxQueries(
    excludeWatched: boolean,
    userId?: number,
  ): number {
    const hasValidUserId = MovieCatalogLookupAiTool.hasValidUserId(userId);
    const isExcludeMode = excludeWatched && hasValidUserId;

    if (isExcludeMode) {
      return ExcludeWatchedRecommendationConstants.CANDIDATE_POOL_SIZE;
    }

    return ExcludeWatchedRecommendationConstants.DEFAULT_MAX_LOOKUP_QUERIES;
  }

  private static hasValidUserId(userId?: number): userId is number {
    if (userId === undefined) {
      return false;
    }

    return userId > 0;
  }

  private static async applyWatchedFilterIfNeeded(
    results: MovieCatalogLookupResult[],
    excludeWatched: boolean,
    userId?: number,
    userMovieEntryRepository?: IUserMovieEntryRepository,
  ): Promise<MovieCatalogLookupResult[]> {
    if (!excludeWatched) {
      return results;
    }

    const hasValidUserId = MovieCatalogLookupAiTool.hasValidUserId(userId);
    if (!hasValidUserId) {
      return results;
    }

    if (!userMovieEntryRepository) {
      Logger.warn("Filtro de assistidos ignorado: repositório não injetado", {
        userId,
      });
      return results;
    }

    const tmdbIds = MovieCatalogLookupAiTool.collectTmdbIdsFromHits(results);
    if (tmdbIds.length === 0) {
      return results;
    }

    const watchedIds =
      await userMovieEntryRepository.findWatchedTmdbIdsByUser(userId, tmdbIds);
    const watchedTmdbIds = new Set(watchedIds);
    const filteredResults = WatchedMovieFilterUtils.filterLookupResults(
      results,
      watchedTmdbIds,
    );

    const removedCount = results.length - filteredResults.length;
    if (removedCount > 0) {
      Logger.debug("Hits assistidos removidos do lookup batch", {
        userId,
        removedCount,
        resultCountBefore: results.length,
        resultCountAfter: filteredResults.length,
      });
    }

    return filteredResults;
  }

  private static collectTmdbIdsFromHits(
    results: MovieCatalogLookupResult[],
  ): number[] {
    const tmdbIds: number[] = [];

    for (const result of results) {
      if (!result.found) {
        continue;
      }

      const tmdbId = result.details.tmdbId;
      tmdbIds.push(tmdbId);
    }

    return tmdbIds;
  }

  private static toLookupInput(queryItem: {
    query: string;
    year?: number | undefined;
    language?: string | undefined;
  }): MovieCatalogLookupInput {
    const year = queryItem.year;
    const language = queryItem.language;
    const hasYear = year !== undefined;
    const hasLanguage = !StringUtils.isEmptyString(language);

    const lookupInput: MovieCatalogLookupInput = {
      query: queryItem.query,
    };
    if (hasYear) {
      lookupInput.year = year;
    }
    if (hasLanguage) {
      lookupInput.language = language;
    }
    return lookupInput;
  }

  private static buildInputSchema(maxQueries: number) {
    const queryItemSchema = z.object({
      query: z.string(),
      year: z.number().optional(),
      language: z.string().optional(),
    });
    const queriesSchema = z
      .array(queryItemSchema)
      .min(MovieCatalogLookupAiTool.MIN_QUERIES)
      .max(maxQueries);

    return z.object({
      queries: queriesSchema,
    });
  }

  private static logSuccess(durationMs: number, queryCount: number) {
    Logger.info("Lookup batch no catálogo concluído", {
      durationMs,
      success: true,
      queryCount,
    });
  }

  private static logFailure(
    durationMs: number,
    queryCount: number,
    error: unknown,
  ) {
    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : String(error);
    Logger.error("Lookup batch no catálogo falhou", {
      durationMs,
      success: false,
      queryCount,
      error: errorMessage,
    });
  }
}
