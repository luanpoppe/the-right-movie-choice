import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AI, AIMessages } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { MovieRecommendationEntity, MovieRecommendationSchema } from "../../../domain/entities/movie-recommendation.entity";
import { WrongMovieSchemaFromLlmException } from "../../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { AiMovieRecommendationProvider } from "../ai-movie-recommendation.provider";
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
  static validEntity(): MovieRecommendationEntity {
    return {
      movies: [
        {
          title: "Inception",
          director: "Christopher Nolan",
          actors: ["Leonardo DiCaprio"],
          releaseYear: 2010,
          streamingPlatform: "Netflix",
          imdbRating: 8.8,
          synopsis: "A thief who steals corporate secrets through dream-sharing.",
          whySuggestion: "Fits a mind-bending request",
          durationInMinutes: 148,
        },
      ],
      response: "sugestão em texto",
    };
  }

  static emptyMoviesWithResponse(): MovieRecommendationEntity {
    return {
      movies: [],
      response: "não encontrei filmes para esse pedido",
    };
  }
}

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
  let provider: AiMovieRecommendationProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    callStructuredOutput = vi.fn();
    call = vi.fn();
    const ai = { callStructuredOutput, call } as unknown as AI;
    provider = new AiMovieRecommendationProvider(ai);
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
      }>(callStructuredOutput.mock.calls, 0);
      expect(structuredCallArgs.aiModel).toBe(AiModels.PRIMARY);
      expect(structuredCallArgs.outputSchema).toBe(MovieRecommendationSchema);
      expect(structuredCallArgs.systemPrompt).toBe(expectedSystemPrompt);
      expect(structuredCallArgs.threadId).toBe(chatId);
      expect(structuredCallArgs.messages).toEqual([expectedHumanMessage]);
      expect(structuredCallArgs.messages).toHaveLength(1);
      expect(result).toEqual(validEntity);
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

  it("não importa ChatHistoryAiMessagesUtils no provider", () => {
    const providerPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/providers/ai-movie-recommendation.provider.ts",
    );
    const providerSource = readFileSync(providerPath, "utf8");

    expect(providerSource).not.toMatch(/ChatHistoryAiMessagesUtils/);
  });
});
