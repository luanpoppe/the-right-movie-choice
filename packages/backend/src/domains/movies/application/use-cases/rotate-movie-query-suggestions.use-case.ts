import { Logger } from "@/lib/logger/logger";
import { MovieQuerySuggestionPoolConstants } from "../../domain/movie-query-suggestion-pool.constants";
import type { IMovieQuerySuggestionBatchProvider } from "../../domain/providers/movie-query-suggestion-batch.provider";
import type { IMovieQuerySuggestionRepository } from "../../domain/repositories/movie-query-suggestion.repository";

export class RotateMovieQuerySuggestionsUseCase {
  constructor(
    private movieQuerySuggestionRepository: IMovieQuerySuggestionRepository,
    private batchProvider: IMovieQuerySuggestionBatchProvider,
  ) {}

  async execute(): Promise<void> {
    await this.movieQuerySuggestionRepository.withSeedLock(async () => {
      await this.runRotation();
    });
  }

  private async runRotation(): Promise<void> {
    const poolSize = MovieQuerySuggestionPoolConstants.POOL_SIZE;
    let poolCount = await this.movieQuerySuggestionRepository.count();

    const isPoolBelowMinimumSize = poolCount < poolSize;
    if (isPoolBelowMinimumSize) {
      await this.topUpPoolToMinimumSize(poolCount, poolSize);
      poolCount = await this.movieQuerySuggestionRepository.count();
    }

    const isStillBelowMinimumSize = poolCount < poolSize;
    if (isStillBelowMinimumSize) {
      Logger.info(
        "Movie query suggestion pool still below minimum size — rotation skipped",
        {
          poolCount,
          poolSize,
        },
      );
      return;
    }

    Logger.info("Starting movie query suggestion pool rotation", {
      poolCount,
      poolSize,
    });

    const batchSize = MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE;
    const existingTexts = await this.movieQuerySuggestionRepository.listTexts();
    const texts = await this.generateBatchWithRetry(batchSize, existingTexts);

    const hasIncompleteRotationBatch = texts.length !== batchSize;
    if (hasIncompleteRotationBatch) {
      Logger.error(
        "Movie query suggestion rotation aborted — incomplete AI batch",
        {
          expected: batchSize,
          received: texts.length,
        },
      );
      throw new Error(
        `Pool rotation aborted: expected ${batchSize} texts from AI, got ${texts.length}`,
      );
    }

    await this.movieQuerySuggestionRepository.rotatePoolAtomically(texts);

    Logger.info("Movie query suggestion pool rotation finished", {
      poolCount,
      poolSize,
      rotatedCount: batchSize,
    });
  }

  private async topUpPoolToMinimumSize(
    poolCountBefore: number,
    poolSize: number,
  ): Promise<void> {
    const missingCount = poolSize - poolCountBefore;

    Logger.info("Starting movie query suggestion pool top-up", {
      poolCountBefore,
      poolSize,
      missingCount,
    });

    const existingTexts = await this.movieQuerySuggestionRepository.listTexts();
    const texts = await this.generateBatchWithRetry(
      missingCount,
      existingTexts,
    );

    const insertedCount =
      await this.movieQuerySuggestionRepository.insertManySkipDuplicates(texts);

    const poolCountAfter = await this.movieQuerySuggestionRepository.count();

    Logger.info("Movie query suggestion pool top-up finished", {
      poolCountBefore,
      poolCountAfter,
      poolSize,
      missingCount,
      insertedCount,
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
            "Movie query suggestion rotation batch failed after all attempts",
            {
              batchSize,
              attempt,
              maxAttempts,
              error: errorMessage,
            },
          );
          throw error;
        }

        Logger.warn("Movie query suggestion rotation batch failed — retrying", {
          batchSize,
          attempt,
          maxAttempts,
        });
      }
    }

    throw new Error(
      "Movie query suggestion rotation batch retry loop ended unexpectedly",
    );
  }
}
