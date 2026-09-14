import { Logger } from "@/lib/logger/logger";
import { MovieQuerySuggestionPoolConstants } from "../../domain/movie-query-suggestion-pool.constants";
import type { IMovieQuerySuggestionBatchProvider } from "../../domain/providers/movie-query-suggestion-batch.provider";
import type { IMovieQuerySuggestionRepository } from "../../domain/repositories/movie-query-suggestion.repository";

export class SeedMovieQuerySuggestionsUseCase {
  constructor(
    private movieQuerySuggestionRepository: IMovieQuerySuggestionRepository,
    private batchProvider: IMovieQuerySuggestionBatchProvider,
  ) {}

  async execute(): Promise<void> {
    const poolSize = MovieQuerySuggestionPoolConstants.POOL_SIZE;
    const poolCountBefore = await this.movieQuerySuggestionRepository.count();

    if (poolCountBefore >= poolSize) {
      Logger.info("Movie query suggestion pool already full — seed skipped", {
        poolCount: poolCountBefore,
        poolSize,
      });
      return;
    }

    Logger.info("Starting movie query suggestion seed", {
      poolCountBefore,
      poolSize,
    });

    let poolCount = poolCountBefore;
    const maxCallsPerRun =
      MovieQuerySuggestionPoolConstants.SEED_MAX_CALLS_PER_RUN;

    for (let callIndex = 0; callIndex < maxCallsPerRun; callIndex++) {
      if (poolCount >= poolSize) {
        break;
      }

      const remainingToPool = poolSize - poolCount;
      const batchSize = Math.min(
        MovieQuerySuggestionPoolConstants.SEED_BATCH_SIZE,
        remainingToPool,
      );

      const existingTexts =
        await this.movieQuerySuggestionRepository.listTexts();
      const texts = await this.generateBatchWithRetry(batchSize, existingTexts);

      const insertedCount =
        await this.movieQuerySuggestionRepository.insertManySkipDuplicates(texts);

      const poolCountAfter =
        await this.movieQuerySuggestionRepository.count();

      Logger.info("Movie query suggestion batch seeded", {
        batchNumber: callIndex + 1,
        batchSize,
        insertedCount,
        poolCountBefore: poolCount,
        poolCountAfter,
      });

      poolCount = poolCountAfter;
    }

    Logger.info("Movie query suggestion seed finished", {
      poolCountBefore,
      poolCountAfter: poolCount,
      poolSize,
    });
  }

  private async generateBatchWithRetry(
    batchSize: number,
    existingTexts: string[],
  ): Promise<string[]> {
    const maxAttempts = MovieQuerySuggestionPoolConstants.SEED_IA_MAX_RETRIES;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const texts = await this.batchProvider.generateBatch(
          batchSize,
          existingTexts,
        );
        return texts;
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;

        if (isLastAttempt) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          Logger.error(
            "Movie query suggestion batch failed after all attempts",
            {
              batchSize,
              attempt,
              maxAttempts,
              error: errorMessage,
            },
          );
          throw error;
        }

        Logger.warn("Movie query suggestion batch failed — retrying", {
          batchSize,
          attempt,
          maxAttempts,
        });
      }
    }

    throw new Error("Movie query suggestion batch retry loop ended unexpectedly");
  }
}
