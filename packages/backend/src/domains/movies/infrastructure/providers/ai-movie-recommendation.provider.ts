import { AI, AIMessages } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { IMovieRecommendationProvider } from "../../application/providers/movie-recommendation.provider";
import {
  MovieRecommendationEntity,
  MovieRecommendationSchema,
} from "../../domain/entities/movie-recommendation.entity";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { MovieRecommendationPrompts } from "./movie-recommendation-prompts";

export class AiMovieRecommendationProvider
  implements IMovieRecommendationProvider
{
  constructor(private ai: AI) {}

  async getMovieRecommendation(
    userMessage: string,
    chatId: string,
  ): Promise<MovieRecommendationEntity> {
    const humanMessage = AIMessages.human(userMessage);
    const messages = [humanMessage];
    const systemPrompt = MovieRecommendationPrompts.unified();
    const startedAtMs = Date.now();

    try {
      const result = await this.ai.callStructuredOutput({
        aiModel: AiModels.PRIMARY,
        systemPrompt,
        messages,
        threadId: chatId,
        outputSchema: MovieRecommendationSchema as never,
      });
      const parseResult = MovieRecommendationSchema.safeParse(result.response);
      if (!parseResult.success) {
        throw new WrongMovieSchemaFromLlmException();
      }

      const durationMs = Date.now() - startedAtMs;
      this.logSuccess("Recomendação de filme concluída", durationMs);
      return parseResult.data;
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      this.logFailure("Recomendação de filme falhou", durationMs, error);
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
