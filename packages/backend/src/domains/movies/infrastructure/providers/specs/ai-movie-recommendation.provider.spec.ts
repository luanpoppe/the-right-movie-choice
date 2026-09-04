import { describe, it, expect, vi, beforeEach } from "vitest";
import { AI, AIMessages } from "@luanpoppe/ai";
import { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
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
    };
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
    it("chama callStructuredOutput com PRIMARY, schema e histórico vazio só com a mensagem humana", async () => {
      const validEntity = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });
      const emptyHistory: ChatHistoryEntity = [];
      const expectedHumanMessage = AIMessages.human(userMessage);
      const expectedSystemPrompt = MovieRecommendationPrompts.structured();

      const result = await provider.getStructuredMoviesRecommendation(
        userMessage,
        emptyHistory,
      );

      const structuredCallArgs = callStructuredOutput.mock.calls[0][0];
      expect(structuredCallArgs.aiModel).toBe(AiModels.PRIMARY);
      expect(structuredCallArgs.outputSchema).toBe(MovieRecommendationSchema);
      expect(structuredCallArgs.systemPrompt).toBe(expectedSystemPrompt);
      expect(structuredCallArgs.messages).toEqual([expectedHumanMessage]);
      expect(result).toEqual(validEntity);
    });

    it("inclui o histórico mapeado antes da mensagem humana", async () => {
      const validEntity = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });
      const chatHistory: ChatHistoryEntity = [
        ["system", "contexto"],
        ["user", "oi"],
        ["ai", "olá"],
      ];
      const expectedMessages = [
        AIMessages.system("contexto"),
        AIMessages.human("oi"),
        AIMessages.ai("olá"),
        AIMessages.human(userMessage),
      ];

      await provider.getStructuredMoviesRecommendation(userMessage, chatHistory);

      const structuredCallArgs = callStructuredOutput.mock.calls[0][0];
      expect(structuredCallArgs.messages).toEqual(expectedMessages);
    });

    it("lança WrongMovieSchemaFromLlmException quando o response não passa no safeParse", async () => {
      callStructuredOutput.mockResolvedValue({ response: { movies: "invalid" } });
      const emptyHistory: ChatHistoryEntity = [];

      await expect(
        provider.getStructuredMoviesRecommendation(userMessage, emptyHistory),
      ).rejects.toBeInstanceOf(WrongMovieSchemaFromLlmException);

      expect(Logger.error).toHaveBeenCalled();
      const errorContext = vi.mocked(Logger.error).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(errorContext.success).toBe(false);
      expect(errorContext.error).toBeDefined();
      LogContextAssertions.expectObservabilityWithoutPromptBody(errorContext);
    });

    it("loga model, durationMs e success sem o corpo do prompt", async () => {
      const validEntity = MovieRecommendationFixtures.validEntity();
      callStructuredOutput.mockResolvedValue({ response: validEntity });
      const emptyHistory: ChatHistoryEntity = [];

      await provider.getStructuredMoviesRecommendation(userMessage, emptyHistory);

      expect(Logger.info).toHaveBeenCalled();
      const infoContext = vi.mocked(Logger.info).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(infoContext.success).toBe(true);
      LogContextAssertions.expectObservabilityWithoutPromptBody(infoContext);
    });
  });

  describe("getChatResponse", () => {
    it("chama ai.call com PRIMARY e devolve result.text", async () => {
      const movies = MovieRecommendationFixtures.validEntity();
      const emptyHistory: ChatHistoryEntity = [];
      const expectedText = "sugestão em texto";
      call.mockResolvedValue({ text: expectedText });
      const moviesJson = JSON.stringify(movies);
      const expectedSystemPrompt = MovieRecommendationPrompts.chat(moviesJson);
      const expectedHumanMessage = AIMessages.human(userMessage);

      const text = await provider.getChatResponse(
        movies,
        userMessage,
        emptyHistory,
      );

      const callArgs = call.mock.calls[0][0];
      expect(callArgs.aiModel).toBe(AiModels.PRIMARY);
      expect(callArgs.systemPrompt).toBe(expectedSystemPrompt);
      expect(callArgs.messages).toEqual([expectedHumanMessage]);
      expect(text).toBe(expectedText);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("loga model, durationMs e success sem o corpo do prompt", async () => {
      const movies = MovieRecommendationFixtures.validEntity();
      call.mockResolvedValue({ text: "ok" });
      const emptyHistory: ChatHistoryEntity = [];

      await provider.getChatResponse(movies, userMessage, emptyHistory);

      expect(Logger.info).toHaveBeenCalled();
      const infoContext = vi.mocked(Logger.info).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(infoContext.success).toBe(true);
      LogContextAssertions.expectObservabilityWithoutPromptBody(infoContext);
    });

    it("loga erro e relança quando ai.call falha", async () => {
      const movies = MovieRecommendationFixtures.validEntity();
      const emptyHistory: ChatHistoryEntity = [];
      const failure = new Error("llm down");
      call.mockRejectedValue(failure);

      await expect(
        provider.getChatResponse(movies, userMessage, emptyHistory),
      ).rejects.toThrow("llm down");

      const errorContext = vi.mocked(Logger.error).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(errorContext.success).toBe(false);
      expect(errorContext.error).toBe("llm down");
      LogContextAssertions.expectObservabilityWithoutPromptBody(errorContext);
    });
  });
});
