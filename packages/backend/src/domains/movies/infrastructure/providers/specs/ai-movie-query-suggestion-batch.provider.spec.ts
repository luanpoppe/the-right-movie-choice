import { describe, it, expect, vi, beforeEach } from "vitest";
import { AI } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { MovieQueryExamplesSchemaFactory } from "../../../domain/entities/movie-query-examples.entity";
import { WrongMovieSchemaFromLlmException } from "../../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { AiMovieQuerySuggestionBatchProvider } from "../ai-movie-query-suggestion-batch.provider";
import { MovieQueryExamplesPrompts } from "../movie-query-examples-prompts";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class MovieQuerySuggestionBatchFixtures {
  static batchResponse(count: number) {
    const queryExamples = Array.from({ length: count }, (_, index) => ({
      queryExample: `Suggestion ${index + 1}`,
    }));

    return { queryExamples };
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

describe("AiMovieQuerySuggestionBatchProvider", () => {
  let callStructuredOutput: ReturnType<typeof vi.fn>;
  let provider: AiMovieQuerySuggestionBatchProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    callStructuredOutput = vi.fn();
    const ai = { callStructuredOutput } as unknown as AI;
    provider = new AiMovieQuerySuggestionBatchProvider(ai);
  });

  describe("generateBatch", () => {
    it("chama callStructuredOutput com schema e prompt para count variável", async () => {
      const count = 25;
      const existingTexts = ["Sci-Fi movies from the 90s"];
      const batchResponse = MovieQuerySuggestionBatchFixtures.batchResponse(count);
      callStructuredOutput.mockResolvedValue({ response: batchResponse });
      const expectedSystemPrompt = MovieQueryExamplesPrompts.textForBatch(
        count,
        existingTexts,
      );

      const texts = await provider.generateBatch(count, existingTexts);

      const structuredCalls = callStructuredOutput.mock.calls;
      const structuredCallArgs = VitestMockCallUtils.nthArg<{
        aiModel: unknown;
        modelConfig: Record<string, unknown>;
        outputSchema: ReturnType<typeof MovieQueryExamplesSchemaFactory.createUpTo>;
        systemPrompt: string;
        messages: unknown[];
      }>(structuredCalls, 0);
      expect(structuredCallArgs.aiModel).toBe(AiModels.PRIMARY);
      expect(structuredCallArgs.modelConfig).toEqual({ temperature: 1.2 });
      expect(structuredCallArgs.outputSchema.safeParse(batchResponse).success).toBe(
        true,
      );
      expect(
        structuredCallArgs.outputSchema.safeParse({
          queryExamples: [{ queryExample: "only one" }],
        }).success,
      ).toBe(true);
      expect(
        structuredCallArgs.outputSchema.safeParse({
          queryExamples: Array.from({ length: 26 }, (_, index) => ({
            queryExample: `Suggestion ${index}`,
          })),
        }).success,
      ).toBe(false);
      expect(structuredCallArgs.systemPrompt).toBe(expectedSystemPrompt);
      expect(structuredCallArgs.messages).toEqual([]);
      expect(texts).toEqual(
        batchResponse.queryExamples.map((item) => item.queryExample),
      );
    });

    it("REQ-6: inclui textos existentes no prompt com casing original", async () => {
      const count = 25;
      const existingTexts = [
        "Sci-Fi movies from the 90s",
        "Action movies with a twist",
      ];
      const batchResponse = MovieQuerySuggestionBatchFixtures.batchResponse(count);
      callStructuredOutput.mockResolvedValue({ response: batchResponse });

      await provider.generateBatch(count, existingTexts);

      const structuredCalls = callStructuredOutput.mock.calls;
      const structuredCallArgs = VitestMockCallUtils.nthArg<{
        systemPrompt: string;
      }>(structuredCalls, 0);
      expect(structuredCallArgs.systemPrompt).toContain(
        "Sci-Fi movies from the 90s",
      );
      expect(structuredCallArgs.systemPrompt).toContain(
        "Action movies with a twist",
      );
    });

    it("lança WrongMovieSchemaFromLlmException quando o response não passa no safeParse", async () => {
      callStructuredOutput.mockResolvedValue({
        response: { queryExamples: "invalid" },
      });

      await expect(provider.generateBatch(25, [])).rejects.toBeInstanceOf(
        WrongMovieSchemaFromLlmException,
      );

      expect(Logger.error).toHaveBeenCalled();
    });

    it("edge: array vazio da IA falha validação do schema", async () => {
      callStructuredOutput.mockResolvedValue({
        response: { queryExamples: [] },
      });

      await expect(provider.generateBatch(25, [])).rejects.toBeInstanceOf(
        WrongMovieSchemaFromLlmException,
      );
    });

    it("loga model, durationMs, count e success sem o corpo da resposta", async () => {
      const batchResponse = MovieQuerySuggestionBatchFixtures.batchResponse(25);
      callStructuredOutput.mockResolvedValue({ response: batchResponse });

      await provider.generateBatch(25, []);

      const infoCalls = vi.mocked(Logger.info).mock.calls;
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        infoCalls,
        1,
      );
      expect(infoContext.success).toBe(true);
      expect(infoContext.count).toBe(25);
      expect(infoContext).not.toHaveProperty("response");
      expect(infoContext).not.toHaveProperty("messages");
    });
  });
});
