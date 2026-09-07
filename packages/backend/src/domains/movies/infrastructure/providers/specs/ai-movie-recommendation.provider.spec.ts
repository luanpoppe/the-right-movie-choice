import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AI, AIMessages } from "@luanpoppe/ai";
import type { AICallParams } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { ExcludeWatchedRecommendationConstants } from "../../../domain/exclude-watched-recommendation.constants";
import { MovieRecommendationEntity, MovieRecommendationLlmSchema, MovieRecommendationSchema } from "../../../domain/entities/movie-recommendation.entity";
import type { IUserMovieEntryRepository } from "../../../domain/repositories/user-movie-entry.repository";
import { WrongMovieSchemaFromLlmException } from "../../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { AiMovieRecommendationProvider } from "../ai-movie-recommendation.provider";
import { ExcludeWatchedRecommendationSanitizer } from "../exclude-watched-recommendation.sanitizer";
import { MovieRecommendationPrompts } from "../movie-recommendation-prompts";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class MovieRecommendationFixtures {
  static validMovie(): MovieRecommendationEntity["movies"][number] {
    return {
      title: "Inception",
      director: "Christopher Nolan",
      actors: ["Leonardo DiCaprio"],
      releaseYear: 2010,
      streamingPlatform: "Netflix",
      imdbRating: 8.8,
      synopsis: "A thief who steals corporate secrets through dream-sharing.",
      whySuggestion: "Fits a mind-bending request",
      durationInMinutes: 148,
    };
  }

  static validEntity(): MovieRecommendationEntity {
    return {
      movies: [MovieRecommendationFixtures.validMovie()],
      response: "sugestão em texto",
    };
  }

  static emptyMoviesWithResponse(): MovieRecommendationEntity {
    return {
      movies: [],
      response: "não encontrei filmes para esse pedido",
    };
  }

  static validEntityWithCatalogIds(): MovieRecommendationEntity {
    const movieWithCatalogIds = {
      ...MovieRecommendationFixtures.validMovie(),
      tmdbId: 27205,
      imdbId: "tt1375666",
    };

    return {
      movies: [movieWithCatalogIds],
      response: "sugestão com ids do catálogo",
    };
  }

  static movieWithTmdbId(
    title: string,
    tmdbId: number,
  ): MovieRecommendationEntity["movies"][number] {
    return {
      ...MovieRecommendationFixtures.validMovie(),
      title,
      tmdbId,
      imdbId: `tt${tmdbId}`,
    };
  }

  static entityWithMovies(
    movies: MovieRecommendationEntity["movies"],
    response = "sugestão",
    scope?: Pick<MovieRecommendationEntity, "requestScope" | "scopeSatisfied">,
  ): MovieRecommendationEntity {
    return { movies, response, ...scope };
  }
}

type AgentTool = NonNullable<
  NonNullable<AICallParams["agent"]>["tools"]
>[number];

class VitestMockCallUtils {
  static firstCall(calls: unknown[][]) {
    const firstCall = calls[0];
    if (!firstCall) {
      throw new Error("expected mock to have been called");
    }
    return firstCall;
  }

  static nthArg<T>(calls: unknown[][], argIndex: number): T {
    const firstCall = VitestMockCallUtils.firstCall(calls);
    const arg = firstCall[argIndex];
    if (arg === undefined) {
      throw new Error(`expected mock argument at index ${argIndex}`);
    }
    return arg as T;
  }

  static callArg<T>(
    calls: unknown[][],
    callIndex: number,
    argIndex: number,
  ): T {
    const call = calls[callIndex];
    if (!call) {
      throw new Error(`expected mock call at index ${callIndex}`);
    }
    const arg = call[argIndex];
    if (arg === undefined) {
      throw new Error(
        `expected mock argument at call ${callIndex}, arg ${argIndex}`,
      );
    }
    return arg as T;
  }
}

class LogContextAssertions {
  static expectObservabilityWithoutPromptBody(context: Record<string, unknown>) {
    expect(context.model).toBe(AiModels.PRIMARY);
    expect(typeof context.durationMs).toBe("number");
    expect(context).not.toHaveProperty("prompt");
    expect(context).not.toHaveProperty("systemPrompt");
    expect(context).not.toHaveProperty("messages");
  }
}

describe("AiMovieRecommendationProvider", () => {
  const userMessage = "quero um filme de ficção";
  const chatId = "chat-123";
  let callStructuredOutput: ReturnType<typeof vi.fn>;
  let call: ReturnType<typeof vi.fn>;
  let lookupMoviesTool: AgentTool;
  let provider: AiMovieRecommendationProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    callStructuredOutput = vi.fn();
    call = vi.fn();
    lookupMoviesTool = { name: "lookupMovies" } as AgentTool;
    const ai = { callStructuredOutput, call } as unknown as AI;
    provider = new AiMovieRecommendationProvider({ ai, lookupMoviesTool });
  });

  describe("getMovieRecommendation", () => {
    it("chama callStructuredOutput uma vez com PRIMARY, schema unificado, threadId e só a mensagem humana atual", async () => {
      const validEntity = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });
      const expectedHumanMessage = AIMessages.human(userMessage);
      const expectedSystemPrompt = MovieRecommendationPrompts.unified();

      const result = await provider.getMovieRecommendation(userMessage, chatId);

      expect(callStructuredOutput).toHaveBeenCalledTimes(1);
      expect(call).not.toHaveBeenCalled();
      const structuredCallArgs = VitestMockCallUtils.nthArg<{
        aiModel: unknown;
        outputSchema: unknown;
        systemPrompt: unknown;
        messages: unknown;
        threadId: unknown;
        agent: { tools: AgentTool[] };
      }>(callStructuredOutput.mock.calls, 0);
      expect(structuredCallArgs.aiModel).toBe(AiModels.PRIMARY);
      expect(structuredCallArgs.outputSchema).toBe(MovieRecommendationLlmSchema);
      expect(structuredCallArgs.systemPrompt).toBe(expectedSystemPrompt);
      expect(structuredCallArgs.threadId).toBe(chatId);
      expect(structuredCallArgs.messages).toEqual([expectedHumanMessage]);
      expect(structuredCallArgs.messages).toHaveLength(1);
      expect(structuredCallArgs.agent.tools).toHaveLength(1);
      expect(structuredCallArgs.agent.tools[0]).toBe(lookupMoviesTool);
      expect(result).toEqual(validEntity);
    });

    it("segue funcionando quando a tool lookupMovies não é invocada pelo modelo", async () => {
      const entityWithoutCatalogIds = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: entityWithoutCatalogIds });

      const result = await provider.getMovieRecommendation(userMessage, chatId);

      expect(result.movies[0]).not.toHaveProperty("tmdbId");
      expect(result.movies[0]).not.toHaveProperty("imdbId");
      expect(result).toEqual(entityWithoutCatalogIds);
      expect(callStructuredOutput).toHaveBeenCalledTimes(1);
    });

    it("aceita filme recomendado sem ids quando catálogo retornou found false", async () => {
      const movieAfterCatalogMiss = MovieRecommendationFixtures.validMovie();
      const entity = {
        movies: [movieAfterCatalogMiss],
        response: "Sugiro mesmo sem hit no catálogo.",
      };
      callStructuredOutput.mockResolvedValue({ response: entity });

      const result = await provider.getMovieRecommendation(userMessage, chatId);

      expect(result).toEqual(entity);
      expect(result.movies[0]).not.toHaveProperty("tmdbId");
      expect(result.movies[0]).not.toHaveProperty("imdbId");
    });

    it("aceita filme com tmdbId e imdbId opcionais no schema interno", async () => {
      const entityWithIds = MovieRecommendationFixtures.validEntityWithCatalogIds();
      callStructuredOutput.mockResolvedValue({ response: entityWithIds });

      const result = await provider.getMovieRecommendation(userMessage, chatId);

      expect(result).toEqual(entityWithIds);
    });

    it("aceita zero filmes com response nonempty", async () => {
      const emptyMoviesEntity = MovieRecommendationFixtures.emptyMoviesWithResponse();
      callStructuredOutput.mockResolvedValue({ response: emptyMoviesEntity });

      const result = await provider.getMovieRecommendation(userMessage, chatId);

      expect(result).toEqual(emptyMoviesEntity);
      expect(call).not.toHaveBeenCalled();
    });

    it("não engole o erro da lib quando callStructuredOutput falha por threadId", async () => {
      const libError = new Error("threadId is required");
      callStructuredOutput.mockRejectedValue(libError);

      await expect(
        provider.getMovieRecommendation(userMessage, chatId),
      ).rejects.toBe(libError);

      expect(Logger.error).toHaveBeenCalled();
      expect(call).not.toHaveBeenCalled();
    });

    it("lança WrongMovieSchemaFromLlmException quando o JSON traz 4 filmes", async () => {
      const fourMovies = Array.from({ length: 4 }, () => ({
        ...MovieRecommendationFixtures.validMovie(),
      }));
      callStructuredOutput.mockResolvedValue({
        response: {
          movies: fourMovies,
          response: "quatro sugestões",
        },
      });

      await expect(
        provider.getMovieRecommendation(userMessage, chatId),
      ).rejects.toBeInstanceOf(WrongMovieSchemaFromLlmException);

      expect(Logger.error).toHaveBeenCalled();
    });

    it("lança WrongMovieSchemaFromLlmException quando response é string vazia", async () => {
      callStructuredOutput.mockResolvedValue({
        response: {
          movies: MovieRecommendationFixtures.validEntity().movies,
          response: "",
        },
      });

      await expect(
        provider.getMovieRecommendation(userMessage, chatId),
      ).rejects.toBeInstanceOf(WrongMovieSchemaFromLlmException);

      expect(Logger.error).toHaveBeenCalled();
    });

    it("lança WrongMovieSchemaFromLlmException quando o response não passa no safeParse", async () => {
      callStructuredOutput.mockResolvedValue({ response: { movies: "invalid" } });

      await expect(
        provider.getMovieRecommendation(userMessage, chatId),
      ).rejects.toBeInstanceOf(WrongMovieSchemaFromLlmException);

      expect(Logger.error).toHaveBeenCalled();
      const errorContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        vi.mocked(Logger.error).mock.calls,
        1,
      );
      expect(errorContext.success).toBe(false);
      expect(errorContext.error).toBeDefined();
      LogContextAssertions.expectObservabilityWithoutPromptBody(errorContext);
    });

    it("loga um único par sucesso/falha com model, durationMs e success sem o corpo do prompt", async () => {
      const validEntity = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });

      await provider.getMovieRecommendation(userMessage, chatId);

      expect(Logger.info).toHaveBeenCalledTimes(1);
      expect(Logger.error).not.toHaveBeenCalled();
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        vi.mocked(Logger.info).mock.calls,
        1,
      );
      expect(infoContext.success).toBe(true);
      LogContextAssertions.expectObservabilityWithoutPromptBody(infoContext);
    });
  });

  describe("exclude-watched", () => {
    const userId = 42;
    let findWatchedTmdbIdsByUser: ReturnType<typeof vi.fn>;
    let userMovieEntryRepository: IUserMovieEntryRepository;

    beforeEach(() => {
      findWatchedTmdbIdsByUser = vi.fn().mockResolvedValue([]);
      userMovieEntryRepository = {
        findWatchedTmdbIdsByUser,
      } as unknown as IUserMovieEntryRepository;
    });

    const buildExcludeWatchedOptions = () => ({
      userId,
      excludeWatched: true as const,
      userMovieEntryRepository,
    });

    it("repete até atingir 2 verificados não-assistidos ou o máximo de rodadas", async () => {
      const roundOneEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Filme A", 100),
      ]);
      const roundTwoEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Filme B", 200),
        MovieRecommendationFixtures.movieWithTmdbId("Filme C", 300),
      ]);
      callStructuredOutput
        .mockResolvedValueOnce({ response: roundOneEntity })
        .mockResolvedValueOnce({ response: roundTwoEntity });

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(callStructuredOutput).toHaveBeenCalledTimes(2);
      expect(result.movies).toHaveLength(2);
      expect(result.movies.map((movie) => movie.tmdbId)).toEqual([200, 300]);
    });

    it("remove filmes assistidos da resposta final", async () => {
      const entity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Assistido", 100),
        MovieRecommendationFixtures.movieWithTmdbId("Livre", 200),
        MovieRecommendationFixtures.movieWithTmdbId("Livre 2", 300),
      ]);
      callStructuredOutput.mockResolvedValue({ response: entity });
      findWatchedTmdbIdsByUser.mockResolvedValue([100]);

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(findWatchedTmdbIdsByUser).toHaveBeenCalledWith(userId, [100, 200, 300]);
      expect(result.movies.map((movie) => movie.tmdbId)).toEqual([200, 300]);
      expect(callStructuredOutput).toHaveBeenCalledTimes(1);
    });

    it("usa o prompt unifiedExcludeWatched no modo exclude-watched", async () => {
      const entity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Filme A", 100),
        MovieRecommendationFixtures.movieWithTmdbId("Filme B", 200),
      ]);
      callStructuredOutput.mockResolvedValue({ response: entity });
      const expectedSystemPrompt = MovieRecommendationPrompts.unifiedExcludeWatched();

      await provider.getMovieRecommendation(userMessage, chatId, buildExcludeWatchedOptions());

      const structuredCallArgs = VitestMockCallUtils.nthArg<{
        systemPrompt: unknown;
      }>(callStructuredOutput.mock.calls, 0);
      expect(structuredCallArgs.systemPrompt).toBe(expectedSystemPrompt);
    });

    it("anexa contexto de exclusão a partir da segunda rodada", async () => {
      const roundOneEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Matrix", 603),
      ]);
      const roundTwoEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Blade Runner", 78),
        MovieRecommendationFixtures.movieWithTmdbId("Arrival", 329865),
      ]);
      callStructuredOutput
        .mockResolvedValueOnce({ response: roundOneEntity })
        .mockResolvedValueOnce({ response: roundTwoEntity });

      await provider.getMovieRecommendation(userMessage, chatId, buildExcludeWatchedOptions());

      const firstRoundMessages = VitestMockCallUtils.callArg<{
        messages: unknown[];
      }>(callStructuredOutput.mock.calls, 0, 0).messages;
      const secondRoundMessages = VitestMockCallUtils.callArg<{
        messages: unknown[];
      }>(callStructuredOutput.mock.calls, 1, 0).messages;

      expect(firstRoundMessages).toHaveLength(1);
      expect(secondRoundMessages).toHaveLength(2);
      expect(secondRoundMessages[1]).toEqual(
        AIMessages.human(
          ExcludeWatchedRecommendationSanitizer.buildExclusionContextMessage([
            { title: "Matrix", tmdbId: 603, watched: false },
          ]),
        ),
      );
    });

    it("envia instrução de rodada final e preserva o response do LLM ao esgotar", async () => {
      const llmResponse =
        "Here is one pick. You've already watched most titles that matched this request.";
      const singleVerifiedEntity = MovieRecommendationFixtures.entityWithMovies(
        [MovieRecommendationFixtures.movieWithTmdbId("Único", 100)],
        llmResponse,
      );
      callStructuredOutput.mockResolvedValue({ response: singleVerifiedEntity });

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(callStructuredOutput).toHaveBeenCalledTimes(
        ExcludeWatchedRecommendationConstants.MAX_EXCLUDE_ROUNDS,
      );

      const lastRoundMessages = VitestMockCallUtils.callArg<{
        messages: unknown[];
      }>(
        callStructuredOutput.mock.calls,
        ExcludeWatchedRecommendationConstants.MAX_EXCLUDE_ROUNDS - 1,
        0,
      ).messages;
      const finalRoundInstruction =
        ExcludeWatchedRecommendationSanitizer.buildFinalRoundInstructionMessage(
          ExcludeWatchedRecommendationConstants.MIN_VERIFIED_UNWATCHED,
        );
      expect(lastRoundMessages).toContainEqual(
        AIMessages.human(finalRoundInstruction),
      );
      expect(result.response).toBe(llmResponse);
      expect(result.response).not.toContain("já assistiu quase tudo do histórico");
      expect(result.movies).toHaveLength(1);
      expect(result.movies[0]?.tmdbId).toBe(100);
    });

    it("REQ-7/8: nova rodada quando sanitização remove assistidos e fica abaixo do mínimo", async () => {
      const roundOneEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Assistido A", 100),
        MovieRecommendationFixtures.movieWithTmdbId("Assistido B", 101),
        MovieRecommendationFixtures.movieWithTmdbId("Livre", 200),
      ]);
      const roundTwoEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Filme C", 300),
        MovieRecommendationFixtures.movieWithTmdbId("Filme D", 400),
      ]);
      callStructuredOutput
        .mockResolvedValueOnce({ response: roundOneEntity })
        .mockResolvedValueOnce({ response: roundTwoEntity });
      findWatchedTmdbIdsByUser.mockResolvedValueOnce([100, 101]);

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(callStructuredOutput).toHaveBeenCalledTimes(2);
      expect(result.movies.map((movie) => movie.tmdbId)).toEqual([300, 400]);
      expect(findWatchedTmdbIdsByUser).toHaveBeenNthCalledWith(1, userId, [
        100, 101, 200,
      ]);
    });

    it("REQ-7: inicia próxima rodada quando todos os filmes verificados da rodada são assistidos", async () => {
      const roundOneEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Assistido A", 100),
        MovieRecommendationFixtures.movieWithTmdbId("Assistido B", 101),
      ]);
      const roundTwoEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Filme C", 300),
        MovieRecommendationFixtures.movieWithTmdbId("Filme D", 400),
      ]);
      callStructuredOutput
        .mockResolvedValueOnce({ response: roundOneEntity })
        .mockResolvedValueOnce({ response: roundTwoEntity });
      findWatchedTmdbIdsByUser
        .mockResolvedValueOnce([100, 101])
        .mockResolvedValueOnce([]);

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(callStructuredOutput).toHaveBeenCalledTimes(2);
      expect(result.movies).toHaveLength(2);
      expect(findWatchedTmdbIdsByUser).toHaveBeenCalledTimes(2);
    });

    it("REQ-4: retorna melhor esforço com zero filmes após esgotar rodadas", async () => {
      const allWatchedEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Assistido", 100),
      ]);
      callStructuredOutput.mockResolvedValue({ response: allWatchedEntity });
      findWatchedTmdbIdsByUser.mockResolvedValue([100]);

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(callStructuredOutput).toHaveBeenCalledTimes(
        ExcludeWatchedRecommendationConstants.MAX_EXCLUDE_ROUNDS,
      );
      expect(result.movies).toEqual([]);
      expect(result.response).toContain("couldn't find many unwatched matches");
      expect(Logger.warn).toHaveBeenCalledWith(
        "⚠️ Rodadas exclude-watched esgotadas sem mínimo verificado",
        expect.objectContaining({
          userId,
          verifiedUnwatchedCount: 0,
          minVerifiedUnwatched:
            ExcludeWatchedRecommendationConstants.MIN_VERIFIED_UNWATCHED,
        }),
      );
    });

    it("para cedo com escopo fechado satisfeito e 1 filme verificado", async () => {
      const closedScopeEntity = MovieRecommendationFixtures.entityWithMovies(
        [MovieRecommendationFixtures.movieWithTmdbId("Deadpool", 293660)],
        "Aqui está o que falta da franquia.",
        { requestScope: "closed", scopeSatisfied: true },
      );
      callStructuredOutput.mockResolvedValue({ response: closedScopeEntity });

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(callStructuredOutput).toHaveBeenCalledTimes(1);
      expect(result.movies).toHaveLength(1);
      expect(result.movies[0]?.tmdbId).toBe(293660);
      expect(result.response).toBe("Aqui está o que falta da franquia.");
      expect(result).not.toHaveProperty("requestScope");
      expect(Logger.warn).not.toHaveBeenCalled();
    });

    it("escopo fechado satisfeito não recebe aviso de esgotamento após esgotar rodadas", async () => {
      const closedScopeOnLastRound = MovieRecommendationFixtures.entityWithMovies(
        [MovieRecommendationFixtures.movieWithTmdbId("Deadpool", 293660)],
        "Só falta este da trilogia.",
        { requestScope: "closed", scopeSatisfied: true },
      );
      const openScopeSingle = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Outro", 100),
      ]);
      callStructuredOutput
        .mockResolvedValueOnce({ response: openScopeSingle })
        .mockResolvedValueOnce({ response: openScopeSingle })
        .mockResolvedValueOnce({ response: openScopeSingle })
        .mockResolvedValueOnce({ response: openScopeSingle })
        .mockResolvedValueOnce({ response: closedScopeOnLastRound });

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(result.movies.map((movie) => movie.tmdbId)).toEqual([293660]);
      expect(result.response).toBe("Só falta este da trilogia.");
      expect(result.response).not.toContain("couldn't find many unwatched matches");
      expect(Logger.warn).not.toHaveBeenCalled();
    });

    it("desempate prefere rodada mais recente com mesmo número de verificados", async () => {
      const roundOneEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Deadpool 2", 383498),
      ]);
      const roundTwoEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Deadpool", 293660),
      ]);
      const emptyRoundEntity = MovieRecommendationFixtures.entityWithMovies([]);
      callStructuredOutput
        .mockResolvedValueOnce({ response: roundOneEntity })
        .mockResolvedValueOnce({ response: roundTwoEntity })
        .mockResolvedValueOnce({ response: emptyRoundEntity })
        .mockResolvedValueOnce({ response: emptyRoundEntity })
        .mockResolvedValueOnce({ response: emptyRoundEntity });

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(callStructuredOutput).toHaveBeenCalledTimes(
        ExcludeWatchedRecommendationConstants.MAX_EXCLUDE_ROUNDS,
      );
      expect(result.movies.map((movie) => movie.tmdbId)).toEqual([293660]);
    });

    it("REQ-4: retorna melhor rodada entre várias quando a última piora", async () => {
      const roundWithOneValid = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Filme OK", 300),
      ]);
      const roundWithNone = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Assistido", 100),
      ]);
      callStructuredOutput
        .mockResolvedValueOnce({ response: roundWithOneValid })
        .mockResolvedValueOnce({ response: roundWithOneValid })
        .mockResolvedValueOnce({ response: roundWithOneValid })
        .mockResolvedValueOnce({ response: roundWithOneValid })
        .mockResolvedValueOnce({ response: roundWithNone });
      findWatchedTmdbIdsByUser
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([100]);

      const result = await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      expect(result.movies.map((movie) => movie.tmdbId)).toEqual([300]);
    });

    it("REQ-7: usa threadId efêmero por rodada para não poluir o chat principal", async () => {
      const validEntity = MovieRecommendationFixtures.entityWithMovies([
        MovieRecommendationFixtures.movieWithTmdbId("Filme A", 100),
        MovieRecommendationFixtures.movieWithTmdbId("Filme B", 200),
      ]);
      callStructuredOutput.mockResolvedValue({ response: validEntity });
      findWatchedTmdbIdsByUser.mockResolvedValue([]);

      await provider.getMovieRecommendation(
        userMessage,
        chatId,
        buildExcludeWatchedOptions(),
      );

      const structuredCallArgs = VitestMockCallUtils.nthArg<{
        threadId: string;
      }>(callStructuredOutput.mock.calls, 0);
      expect(structuredCallArgs.threadId).toBe(`${chatId}:exclude:1`);
    });

    it("com excludeWatched true sem userId faz uma única chamada como o fluxo legado", async () => {
      const validEntity = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });
      const expectedSystemPrompt = MovieRecommendationPrompts.unified();

      const result = await provider.getMovieRecommendation(userMessage, chatId, {
        excludeWatched: true,
        userMovieEntryRepository,
      });

      expect(callStructuredOutput).toHaveBeenCalledTimes(1);
      const structuredCallArgs = VitestMockCallUtils.nthArg<{
        systemPrompt: unknown;
        messages: unknown[];
      }>(callStructuredOutput.mock.calls, 0);
      expect(structuredCallArgs.systemPrompt).toBe(expectedSystemPrompt);
      expect(structuredCallArgs.messages).toHaveLength(1);
      expect(result).toEqual(validEntity);
      expect(findWatchedTmdbIdsByUser).not.toHaveBeenCalled();
    });
  });

  it("não importa ChatHistoryAiMessagesUtils no provider", () => {
    const providerPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/providers/ai-movie-recommendation.provider.ts",
    );
    const providerSource = readFileSync(providerPath, "utf8");

    expect(providerSource).not.toMatch(/ChatHistoryAiMessagesUtils/);
  });
});
