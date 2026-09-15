import { Logger } from "@/lib/logger/logger";
import { IMovieQueryExampleProvider } from "../../application/providers/movie-query-example.provider";
import {
  MOVIE_QUERY_EXAMPLES_COUNT,
  MovieQueryExamplesEntity,
  MovieQueryExamplesSchema,
} from "../../domain/entities/movie-query-examples.entity";
import { IMovieQuerySuggestionRepository } from "../../domain/repositories/movie-query-suggestion.repository";

export class PoolFirstMovieQueryExamplesProvider
  implements IMovieQueryExampleProvider
{
  constructor(
    private repository: IMovieQuerySuggestionRepository,
    private aiFallbackProvider: IMovieQueryExampleProvider,
  ) {}

  async getQueryExamples(): Promise<MovieQueryExamplesEntity> {
    try {
      const poolCount = await this.repository.count();
      const hasEnoughPoolItems = poolCount >= MOVIE_QUERY_EXAMPLES_COUNT;

      if (!hasEnoughPoolItems) {
        this.logInsufficientPoolFallback(poolCount);
        return this.getQueryExamplesFromAi();
      }

      const limit = MOVIE_QUERY_EXAMPLES_COUNT;
      const texts = await this.repository.pickRandomTexts(limit);
      const entity = PoolFirstMovieQueryExamplesProvider.mapTextsToEntity(texts);
      const parseResult = MovieQueryExamplesSchema.safeParse(entity);
      const isValidPoolEntity = parseResult.success;

      if (!isValidPoolEntity) {
        this.logInvalidPoolResponseFallback(texts.length);
        return this.getQueryExamplesFromAi();
      }

      return parseResult.data;
    } catch (error) {
      this.logDatabaseErrorFallback(error);
      return this.getQueryExamplesFromAi();
    }
  }

  private async getQueryExamplesFromAi(): Promise<MovieQueryExamplesEntity> {
    return this.aiFallbackProvider.getQueryExamples();
  }

  private logInsufficientPoolFallback(poolCount: number) {
    Logger.info("Movie query examples pool insufficient, falling back to AI", {
      poolCount,
      requiredCount: MOVIE_QUERY_EXAMPLES_COUNT,
      fallbackReason: "insufficient_pool",
    });
  }

  private logInvalidPoolResponseFallback(returnedCount: number) {
    Logger.info("Movie query examples pool response invalid, falling back to AI", {
      returnedCount,
      requiredCount: MOVIE_QUERY_EXAMPLES_COUNT,
      fallbackReason: "invalid_pool_response",
    });
  }

  private logDatabaseErrorFallback(error: unknown) {
    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : String(error);
    Logger.info("Movie query examples pool read failed, falling back to AI", {
      requiredCount: MOVIE_QUERY_EXAMPLES_COUNT,
      fallbackReason: "database_error",
      error: errorMessage,
    });
  }

  private static mapTextsToEntity(texts: string[]): MovieQueryExamplesEntity {
    const queryExamples = texts.map((text) => ({ queryExample: text }));
    return { queryExamples };
  }
}
