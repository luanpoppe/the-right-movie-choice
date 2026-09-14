import { AI } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { MovieQueryExamplesSchemaFactory } from "../../domain/entities/movie-query-examples.entity";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import type { IMovieQuerySuggestionBatchProvider } from "../../domain/providers/movie-query-suggestion-batch.provider";
import { MovieQueryExamplesPrompts } from "./movie-query-examples-prompts";

export class AiMovieQuerySuggestionBatchProvider
  implements IMovieQuerySuggestionBatchProvider
{
  constructor(private ai: AI) {}

  async generateBatch(
    count: number,
    existingTexts: string[],
  ): Promise<string[]> {
    const outputSchema = MovieQueryExamplesSchemaFactory.create(count);
    const systemPrompt = MovieQueryExamplesPrompts.textForBatch(
      count,
      existingTexts,
    );
    const temperature = MovieQueryExamplesPrompts.QUERY_EXAMPLES_TEMPERATURE;
    const modelConfig = { temperature };
    const startedAtMs = Date.now();

    try {
      const result = await this.ai.callStructuredOutput({
        aiModel: AiModels.PRIMARY,
        modelConfig,
        systemPrompt,
        messages: [],
        outputSchema: outputSchema as never,
      });

      const parseResult = outputSchema.safeParse(result.response);
      if (!parseResult.success) {
        throw new WrongMovieSchemaFromLlmException();
      }

      const texts = parseResult.data.queryExamples.map(
        (item) => item.queryExample,
      );

      const durationMs = Date.now() - startedAtMs;
      this.logSuccess(
        "Movie query suggestion batch completed",
        durationMs,
        count,
      );
      return texts;
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      this.logFailure(
        "Movie query suggestion batch failed",
        durationMs,
        count,
        error,
      );
      throw error;
    }
  }

  private logSuccess(message: string, durationMs: number, count: number) {
    Logger.info(message, {
      model: AiModels.PRIMARY,
      durationMs,
      count,
      success: true,
    });
  }

  private logFailure(
    message: string,
    durationMs: number,
    count: number,
    error: unknown,
  ) {
    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : String(error);
    Logger.error(message, {
      model: AiModels.PRIMARY,
      durationMs,
      count,
      success: false,
      error: errorMessage,
    });
  }
}
