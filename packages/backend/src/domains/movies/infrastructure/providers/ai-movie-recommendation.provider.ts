import { AI, AIMessages } from "@luanpoppe/ai";
import { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { IMovieRecommendationProvider } from "../../application/providers/movie-recommendation.provider";
import {
  MovieRecommendationEntity,
  MovieRecommendationSchema,
} from "../../domain/entities/movie-recommendation.entity";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { ChatHistoryAiMessagesUtils } from "./chat-history-ai-messages.utils";
import { MovieRecommendationPrompts } from "./movie-recommendation-prompts";

export class AiMovieRecommendationProvider
  implements IMovieRecommendationProvider
{
  constructor(private ai: AI) {}

  async getStructuredMoviesRecommendation(
    userMessage: string,
    chatHistory: ChatHistoryEntity,
  ) {
    const mappedHistory = ChatHistoryAiMessagesUtils.toAiMessages(chatHistory);
    const humanMessage = AIMessages.human(userMessage);
    const messages = [...mappedHistory, humanMessage];
    const systemPrompt = MovieRecommendationPrompts.structured();
    const startedAtMs = Date.now();

    try {
      const result = await this.ai.callStructuredOutput({
        aiModel: AiModels.PRIMARY,
        systemPrompt,
        messages,
        outputSchema: MovieRecommendationSchema as never,
      });
      const parseResult = MovieRecommendationSchema.safeParse(result.response);
      if (!parseResult.success) {
        throw new WrongMovieSchemaFromLlmException();
      }

      const durationMs = Date.now() - startedAtMs;
      this.logSuccess("Movie structured recommendation completed", durationMs);
      return parseResult.data;
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      this.logFailure("Movie structured recommendation failed", durationMs, error);
      throw error;
    }
  }

  async getChatResponse(
    movies: MovieRecommendationEntity,
    userMessage: string,
    chatHistory: ChatHistoryEntity,
  ) {
    const moviesJson = JSON.stringify(movies);
    const systemPrompt = MovieRecommendationPrompts.chat(moviesJson);
    const mappedHistory = ChatHistoryAiMessagesUtils.toAiMessages(chatHistory);
    const humanMessage = AIMessages.human(userMessage);
    const messages = [...mappedHistory, humanMessage];
    const startedAtMs = Date.now();

    try {
      const result = await this.ai.call({
        aiModel: AiModels.PRIMARY,
        systemPrompt,
        messages,
      });
      const durationMs = Date.now() - startedAtMs;
      this.logSuccess("Movie chat recommendation completed", durationMs);
      return result.text;
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      this.logFailure("Movie chat recommendation failed", durationMs, error);
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
