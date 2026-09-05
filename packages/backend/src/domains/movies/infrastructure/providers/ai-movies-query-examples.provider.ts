import { AI, AIMessages } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { IMovieQueryExampleProvider } from "../../application/providers/movie-query-example.provider";
import { MovieQueryExamplesSchema } from "../../domain/entities/movie-query-examples.entity";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { MovieQueryExamplesPrompts } from "./movie-query-examples-prompts";

export class AiMoviesQueryExamplesProvider
  implements IMovieQueryExampleProvider
{
  constructor(private ai: AI) {}

  async getQueryExamples() {
    const promptText = MovieQueryExamplesPrompts.text();
    const humanMessage = AIMessages.human(promptText);
    const messages = [humanMessage];
    const temperature = MovieQueryExamplesPrompts.QUERY_EXAMPLES_TEMPERATURE;
    const modelConfig = { temperature };
    const startedAtMs = Date.now();

    try {
      const result = await this.ai.callStructuredOutput({
        aiModel: AiModels.PRIMARY,
        modelConfig,
        messages,
        outputSchema: MovieQueryExamplesSchema as never,
      });
      const parseResult = MovieQueryExamplesSchema.safeParse(result.response);
      if (!parseResult.success) {
        throw new WrongMovieSchemaFromLlmException();
      }

      const durationMs = Date.now() - startedAtMs;
      this.logSuccess("Movie query examples completed", durationMs);
      return parseResult.data;
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      this.logFailure("Movie query examples failed", durationMs, error);
      throw error;
    }
  }

  private logSuccess(message: string, durationMs: number) {
    Logger.info(message, {
      model: AiModels.PRIMARY,
      durationMs,
      success: true,
    });
  }

  private logFailure(message: string, durationMs: number, error: unknown) {
    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : String(error);
    Logger.error(message, {
      model: AiModels.PRIMARY,
      durationMs,
      success: false,
      error: errorMessage,
    });
  }
}
