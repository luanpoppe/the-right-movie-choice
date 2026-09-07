import { AI, AIMessages } from "@luanpoppe/ai";
import type { AICallParams } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import {
  IMovieRecommendationProvider,
  type MovieRecommendationProviderOptions,
} from "../../application/providers/movie-recommendation.provider";
import {
  MovieRecommendationEntity,
  MovieRecommendationLlmSchema,
  MovieRecommendationSchema,
} from "../../domain/entities/movie-recommendation.entity";
import { ExcludeWatchedRecommendationConstants } from "../../domain/exclude-watched-recommendation.constants";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import {
  ExcludeWatchedRecommendationSanitizer,
  type ExcludeWatchedContextEntry,
} from "./exclude-watched-recommendation.sanitizer";
import { MovieRecommendationPrompts } from "./movie-recommendation-prompts";

type AgentTool = NonNullable<
  NonNullable<AICallParams["agent"]>["tools"]
>[number];

type AiMovieRecommendationProviderParams = {
  ai: AI;
  lookupMoviesTool: AgentTool;
};

export class AiMovieRecommendationProvider
  implements IMovieRecommendationProvider
{
  constructor(private readonly params: AiMovieRecommendationProviderParams) {}

  async getMovieRecommendation(
    userMessage: string,
    chatId: string,
    options?: MovieRecommendationProviderOptions,
  ): Promise<MovieRecommendationEntity> {
    const isExcludeWatchedMode =
      AiMovieRecommendationProvider.isExcludeWatchedMode(options);
    const startedAtMs = Date.now();

    try {
      const recommendation = isExcludeWatchedMode
        ? await this.getExcludeWatchedRecommendation(
            userMessage,
            chatId,
            options!,
          )
        : await this.getStandardRecommendation(userMessage, chatId);

      const durationMs = Date.now() - startedAtMs;
      this.logSuccess("Recomendação de filme concluída", durationMs, {
        excludeWatched: isExcludeWatchedMode,
      });
      return recommendation;
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      this.logFailure("Recomendação de filme falhou", durationMs, error);
      throw error;
    }
  }

  private async getStandardRecommendation(
    userMessage: string,
    chatId: string,
  ): Promise<MovieRecommendationEntity> {
    const humanMessage = AIMessages.human(userMessage);
    const messages = [humanMessage];
    const systemPrompt = MovieRecommendationPrompts.unified();

    return this.callStructuredRecommendation({
      systemPrompt,
      messages,
      threadId: chatId,
    });
  }

  private async getExcludeWatchedRecommendation(
    userMessage: string,
    chatId: string,
    options: MovieRecommendationProviderOptions,
  ): Promise<MovieRecommendationEntity> {
    const userId = options.userId!;
    const userMovieEntryRepository = options.userMovieEntryRepository!;
    const humanMessage = AIMessages.human(userMessage);
    const baseMessages = [humanMessage];
    const systemPrompt = MovieRecommendationPrompts.unifiedExcludeWatched();
    const maxRounds = ExcludeWatchedRecommendationConstants.MAX_EXCLUDE_ROUNDS;
    const minVerifiedUnwatched =
      ExcludeWatchedRecommendationConstants.MIN_VERIFIED_UNWATCHED;

    let exclusionEntries: ExcludeWatchedContextEntry[] = [];
    let bestSanitizedRecommendation: MovieRecommendationEntity | null = null;
    let bestVerifiedUnwatchedCount = 0;
    let bestRoundNumber = 0;
    let bestClosedScopeSatisfied = false;

    Logger.info("🚀 Iniciando recomendação exclude-watched", {
      chatId,
      userId,
      maxRounds,
      minVerifiedUnwatched,
    });

    for (let round = 1; round <= maxRounds; round++) {
      const isLastRound = round === maxRounds;
      const exclusionContextMessage =
        ExcludeWatchedRecommendationSanitizer.buildExclusionContextMessage(
          exclusionEntries,
        );
      const finalRoundInstruction = isLastRound
        ? ExcludeWatchedRecommendationSanitizer.buildFinalRoundInstructionMessage(
            minVerifiedUnwatched,
          )
        : "";
      const extraMessages = [];

      if (exclusionContextMessage.length > 0) {
        extraMessages.push(AIMessages.human(exclusionContextMessage));
      }
      if (finalRoundInstruction.length > 0) {
        extraMessages.push(AIMessages.human(finalRoundInstruction));
      }

      const messages =
        extraMessages.length > 0
          ? [...baseMessages, ...extraMessages]
          : baseMessages;

      Logger.info("🔄 Rodada exclude-watched", {
        chatId,
        userId,
        round,
        maxRounds,
        hasExclusionContext: exclusionContextMessage.length > 0,
        hasFinalRoundInstruction: finalRoundInstruction.length > 0,
        exclusionEntryCount: exclusionEntries.length,
      });

      const parsedRecommendation = await this.callStructuredRecommendation({
        systemPrompt,
        messages,
        threadId: `${chatId}:exclude:${round}`,
      });
      const tmdbIds = ExcludeWatchedRecommendationSanitizer.extractTmdbIds(
        parsedRecommendation.movies,
      );
      const watchedTmdbIds =
        await userMovieEntryRepository.findWatchedTmdbIdsByUser(
          userId,
          tmdbIds,
        );
      const watchedTmdbIdSet = new Set(watchedTmdbIds);
      const roundResult = ExcludeWatchedRecommendationSanitizer.processRoundResult(
        parsedRecommendation,
        watchedTmdbIdSet,
        exclusionEntries,
      );
      const sanitizedRecommendation = roundResult.sanitized;
      const verifiedUnwatchedCount = roundResult.verifiedUnwatchedCount;
      exclusionEntries = roundResult.exclusionEntries;
      const isClosedScopeSatisfied =
        ExcludeWatchedRecommendationSanitizer.isClosedScopeSatisfied(
          sanitizedRecommendation,
        );

      const isBetterRound =
        bestSanitizedRecommendation === null ||
        AiMovieRecommendationProvider.isBetterExcludeRound(
          verifiedUnwatchedCount,
          sanitizedRecommendation.movies.length,
          round,
          bestVerifiedUnwatchedCount,
          bestSanitizedRecommendation.movies.length,
          bestRoundNumber,
        );
      if (isBetterRound) {
        bestVerifiedUnwatchedCount = verifiedUnwatchedCount;
        bestSanitizedRecommendation = sanitizedRecommendation;
        bestRoundNumber = round;
        bestClosedScopeSatisfied = isClosedScopeSatisfied;
      }

      Logger.debug("📊 Resultado da rodada exclude-watched", {
        chatId,
        userId,
        round,
        verifiedUnwatchedCount,
        movieCount: sanitizedRecommendation.movies.length,
        watchedRemovedCount: parsedRecommendation.movies.length -
          sanitizedRecommendation.movies.length,
        requestScope: sanitizedRecommendation.requestScope,
        scopeSatisfied: sanitizedRecommendation.scopeSatisfied,
      });

      const canStopRound =
        ExcludeWatchedRecommendationSanitizer.canStopExcludeWatchedRound(
          verifiedUnwatchedCount,
          sanitizedRecommendation,
          minVerifiedUnwatched,
        );
      if (canStopRound) {
        return AiMovieRecommendationProvider.stripExcludeWatchedResponse(
          sanitizedRecommendation,
        );
      }

      if (isLastRound) {
        break;
      }
    }

    if (!bestSanitizedRecommendation) {
      throw new WrongMovieSchemaFromLlmException();
    }

    const shouldApplyExhaustionNotice =
      ExcludeWatchedRecommendationSanitizer.shouldApplyExhaustionNotice(
        bestVerifiedUnwatchedCount,
        minVerifiedUnwatched,
        bestClosedScopeSatisfied,
      );
    if (!shouldApplyExhaustionNotice) {
      return AiMovieRecommendationProvider.stripExcludeWatchedResponse(
        bestSanitizedRecommendation,
      );
    }

    Logger.warn("⚠️ Rodadas exclude-watched esgotadas sem mínimo verificado", {
      chatId,
      userId,
      verifiedUnwatchedCount: bestVerifiedUnwatchedCount,
      minVerifiedUnwatched,
      maxRounds,
    });

    const ensuredResponse =
      ExcludeWatchedRecommendationSanitizer.ensureExhaustionNotice(
        bestSanitizedRecommendation.response,
      );

    const exhaustedRecommendation = {
      ...bestSanitizedRecommendation,
      response: ensuredResponse,
    };

    return AiMovieRecommendationProvider.stripExcludeWatchedResponse(
      exhaustedRecommendation,
    );
  }

  private static stripExcludeWatchedResponse(
    recommendation: MovieRecommendationEntity,
  ): MovieRecommendationEntity {
    return ExcludeWatchedRecommendationSanitizer.stripScopeMetadata(
      recommendation,
    );
  }

  private static isBetterExcludeRound(
    verifiedCount: number,
    movieCount: number,
    round: number,
    bestVerifiedCount: number,
    bestMovieCount: number,
    bestRound: number,
  ): boolean {
    if (verifiedCount > bestVerifiedCount) {
      return true;
    }

    const isTieOnVerified = verifiedCount === bestVerifiedCount;
    if (!isTieOnVerified) {
      return false;
    }

    if (movieCount > bestMovieCount) {
      return true;
    }

    const isTieOnMovieCount = movieCount === bestMovieCount;
    if (!isTieOnMovieCount) {
      return false;
    }

    return round > bestRound;
  }

  private async callStructuredRecommendation(params: {
    systemPrompt: string;
    messages: ReturnType<typeof AIMessages.human>[];
    threadId: string;
  }): Promise<MovieRecommendationEntity> {
    const lookupMoviesTool = this.params.lookupMoviesTool;
    const result = await this.params.ai.callStructuredOutput({
      aiModel: AiModels.PRIMARY,
      systemPrompt: params.systemPrompt,
      messages: params.messages,
      threadId: params.threadId,
      outputSchema: MovieRecommendationLlmSchema as never,
      agent: { tools: [lookupMoviesTool] },
    });
    const parseResult = MovieRecommendationSchema.safeParse(result.response);
    if (!parseResult.success) {
      throw new WrongMovieSchemaFromLlmException();
    }

    return parseResult.data;
  }

  private static isExcludeWatchedMode(
    options?: MovieRecommendationProviderOptions,
  ): boolean {
    const excludeWatched = options?.excludeWatched === true;
    const userId = options?.userId;
    const hasValidUserId = userId !== undefined && userId > 0;
    const hasRepository = options?.userMovieEntryRepository !== undefined;
    const isExcludeMode = excludeWatched && hasValidUserId && hasRepository;

    return isExcludeMode;
  }

  private logSuccess(
    message: string,
    durationMs: number,
    extra?: { excludeWatched?: boolean },
  ) {
    Logger.info(message, {
      model: AiModels.PRIMARY,
      durationMs,
      success: true,
      excludeWatched: extra?.excludeWatched ?? false,
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
