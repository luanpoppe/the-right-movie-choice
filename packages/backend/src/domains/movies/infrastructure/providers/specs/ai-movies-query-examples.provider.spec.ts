import { describe, it, expect, vi, beforeEach } from "vitest";
import { AI, AIMessages } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { MovieQueryExamplesEntity, MovieQueryExamplesSchema } from "../../../domain/entities/movie-query-examples.entity";
import { WrongMovieSchemaFromLlmException } from "../../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { AiMoviesQueryExamplesProvider } from "../ai-movies-query-examples.provider";
import { MovieQueryExamplesPrompts } from "../movie-query-examples-prompts";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class MovieQueryExamplesFixtures {
  static validEntity(): MovieQueryExamplesEntity {
    return {
      queryExamples: [
        { queryExample: "80s action movies with strong female leads" },
        { queryExample: "2000s fantasy films with dragons" },
        { queryExample: "sci-fi movies about time travel" },
      ],
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
    expect(context).not.toHaveProperty("response");
    expect(context).not.toHaveProperty("body");
  }
}

describe("AiMoviesQueryExamplesProvider", () => {
  let callStructuredOutput: ReturnType<typeof vi.fn>;
  let provider: AiMoviesQueryExamplesProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    callStructuredOutput = vi.fn();
    const ai = { callStructuredOutput } as unknown as AI;
    provider = new AiMoviesQueryExamplesProvider(ai);
  });

  describe("getQueryExamples", () => {
    it("chama callStructuredOutput com PRIMARY, temperature 1.2, mensagem humana e schema", async () => {
      const validEntity = MovieQueryExamplesFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });
      const expectedHumanMessage = AIMessages.human(
        MovieQueryExamplesPrompts.text(),
      );

      const result = await provider.getQueryExamples();

      const structuredCalls = callStructuredOutput.mock.calls;
      const structuredCallArgs = VitestMockCallUtils.nthArg<{
        aiModel: unknown;
        modelConfig: Record<string, unknown>;
        outputSchema: unknown;
        messages: unknown;
      }>(structuredCalls, 0);
      expect(structuredCallArgs.aiModel).toBe(AiModels.PRIMARY);
      expect(structuredCallArgs.modelConfig).toEqual({
        temperature: 1.2,
      });
      expect(structuredCallArgs.modelConfig.temperature).toBe(
        MovieQueryExamplesPrompts.QUERY_EXAMPLES_TEMPERATURE,
      );
      expect(structuredCallArgs.outputSchema).toBe(MovieQueryExamplesSchema);
      expect(structuredCallArgs.messages).toEqual([expectedHumanMessage]);
      expect(structuredCallArgs).not.toHaveProperty("systemPrompt");
      expect(structuredCallArgs).not.toHaveProperty("threadId");
      expect(structuredCallArgs).not.toHaveProperty("cache");
      expect(structuredCallArgs.modelConfig).not.toHaveProperty("cache");
      expect(result).toEqual(validEntity);
    });

    it("lança WrongMovieSchemaFromLlmException quando o response não passa no safeParse", async () => {
      callStructuredOutput.mockResolvedValue({
        response: { queryExamples: "invalid" },
      });

      await expect(provider.getQueryExamples()).rejects.toBeInstanceOf(
        WrongMovieSchemaFromLlmException,
      );

      expect(Logger.error).toHaveBeenCalled();
      const errorCalls = vi.mocked(Logger.error).mock.calls;
      const errorContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        errorCalls,
        1,
      );
      expect(errorContext.success).toBe(false);
      expect(errorContext.error).toBeDefined();
      LogContextAssertions.expectObservabilityWithoutPromptBody(errorContext);
    });

    it("loga model, durationMs e success sem o corpo da resposta", async () => {
      const validEntity = MovieQueryExamplesFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });

      await provider.getQueryExamples();

      expect(Logger.info).toHaveBeenCalled();
      const infoCalls = vi.mocked(Logger.info).mock.calls;
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        infoCalls,
        1,
      );
      expect(infoContext.success).toBe(true);
      LogContextAssertions.expectObservabilityWithoutPromptBody(infoContext);
    });

    it("loga erro e relança quando callStructuredOutput falha", async () => {
      const failure = new Error("llm down");
      callStructuredOutput.mockRejectedValue(failure);

      await expect(provider.getQueryExamples()).rejects.toThrow("llm down");

      const errorCalls = vi.mocked(Logger.error).mock.calls;
      const errorContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        errorCalls,
        1,
      );
      expect(errorContext.success).toBe(false);
      expect(errorContext.error).toBe("llm down");
      LogContextAssertions.expectObservabilityWithoutPromptBody(errorContext);
    });
  });
});
