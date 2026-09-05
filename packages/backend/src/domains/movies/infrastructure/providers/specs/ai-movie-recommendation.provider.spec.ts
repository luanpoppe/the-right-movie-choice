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
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    callStructuredOutput = vi.fn();
    call = vi.fn();
    const ai = { callStructuredOutput, call } as unknown as AI;
    provider = new AiMovieRecommendationProvider(ai);
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("getStructuredMoviesRecommendation", () => {
    it("chama callStructuredOutput com PRIMARY, schema, threadId e só a mensagem humana atual", async () => {
      const validEntity = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });
      const expectedHumanMessage = AIMessages.human(userMessage);
      const expectedSystemPrompt = MovieRecommendationPrompts.unified();

      const result = await provider.getStructuredMoviesRecommendation(
        userMessage,
        chatId,
      );

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
      expect(result).toEqual(validEntity);
      expect(structuredCallArgs.messages).toHaveLength(1);
    });

    it("não engole o erro da lib quando callStructuredOutput falha por threadId", async () => {
      const libError = new Error("threadId is required");
      callStructuredOutput.mockRejectedValue(libError);

      await expect(
        provider.getStructuredMoviesRecommendation(userMessage, chatId),
      ).rejects.toBe(libError);

      expect(Logger.error).toHaveBeenCalled();
    });

    it("lança WrongMovieSchemaFromLlmException quando o response não passa no safeParse", async () => {
      callStructuredOutput.mockResolvedValue({ response: { movies: "invalid" } });

      await expect(
        provider.getStructuredMoviesRecommendation(userMessage, chatId),
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

    it("loga model, durationMs e success sem o corpo do prompt", async () => {
      const validEntity = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });

      await provider.getStructuredMoviesRecommendation(userMessage, chatId);

      expect(Logger.info).toHaveBeenCalled();
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        vi.mocked(Logger.info).mock.calls,
        1,
      );
      expect(infoContext.success).toBe(true);
      LogContextAssertions.expectObservabilityWithoutPromptBody(infoContext);
    });
  });

  describe("getChatResponse", () => {
    it("chama ai.call com PRIMARY, threadId e devolve result.text", async () => {
      const movies = MovieRecommendationFixtures.validEntity();
      const expectedText = "sugestão em texto";
      call.mockResolvedValue({ text: expectedText });
      const expectedSystemPrompt = MovieRecommendationPrompts.unified();
      const expectedHumanMessage = AIMessages.human(userMessage);

      const text = await provider.getChatResponse(
        movies,
        userMessage,
        chatId,
      );

      const callArgs = VitestMockCallUtils.nthArg<{
        aiModel: unknown;
        systemPrompt: unknown;
        messages: unknown;
        threadId: unknown;
      }>(call.mock.calls, 0);
      expect(callArgs.aiModel).toBe(AiModels.PRIMARY);
      expect(callArgs.systemPrompt).toBe(expectedSystemPrompt);
      expect(callArgs.threadId).toBe(chatId);
      expect(callArgs.messages).toEqual([expectedHumanMessage]);
      expect(text).toBe(expectedText);
      expect(callArgs.messages).toHaveLength(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("não engole o erro da lib quando ai.call falha por threadId", async () => {
      const movies = MovieRecommendationFixtures.validEntity();
      const libError = new Error("threadId is required");
      call.mockRejectedValue(libError);

      await expect(
        provider.getChatResponse(movies, userMessage, chatId),
      ).rejects.toBe(libError);
    });

    it("loga model, durationMs e success sem o corpo do prompt", async () => {
      const movies = MovieRecommendationFixtures.validEntity();
      call.mockResolvedValue({ text: "ok" });

      await provider.getChatResponse(movies, userMessage, chatId);

      expect(Logger.info).toHaveBeenCalled();
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        vi.mocked(Logger.info).mock.calls,
        1,
      );
      expect(infoContext.success).toBe(true);
      LogContextAssertions.expectObservabilityWithoutPromptBody(infoContext);
    });

    it("loga erro e relança quando ai.call falha", async () => {
      const movies = MovieRecommendationFixtures.validEntity();
      const failure = new Error("llm down");
      call.mockRejectedValue(failure);

      await expect(
        provider.getChatResponse(movies, userMessage, chatId),
      ).rejects.toThrow("llm down");

      const errorContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        vi.mocked(Logger.error).mock.calls,
        1,
      );
      expect(errorContext.success).toBe(false);
      expect(errorContext.error).toBe("llm down");
      LogContextAssertions.expectObservabilityWithoutPromptBody(errorContext);
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
