import { describe, it, expect, vi, beforeEach } from "vitest";
import { LangchainMovieRecommendationProvider } from "./langchain-movie-recommendation.provider";
import { Langchain } from "@/lib/langchain/langchain";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessageChunk } from "@langchain/core/messages";
import {
  MovieRecommendationEntity,
  MovieRecommendationSchema,
} from "../../domain/entities/movie-recommendation.entity";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { ChatHistoryEntity } from "@/core/entities/chat-history.entity";

describe("LangchainMovieRecommendationProvider", () => {
  let langchain: Langchain;
  let model: BaseChatModel;
  let provider: LangchainMovieRecommendationProvider;

  beforeEach(() => {
    model = {
      invoke: vi.fn(),
    } as unknown as BaseChatModel;

    langchain = {
      prompt: {
        parseChatHistory: vi.fn((history) => history.flat().join(" ")),
      },
      callWithStructuredOutput: vi.fn(),
    } as unknown as Langchain;

    provider = new LangchainMovieRecommendationProvider(langchain, model);
  });

  describe("getStructuredMoviesRecommendation", () => {
    it("should return structured movie recommendations", async () => {
      const userMessage = "I want a comedy movie";
      const chatHistory: ChatHistoryEntity = [
        ["user", "hello"],
        ["ai", "hi"],
      ];
      const mockLlmResponse: MovieRecommendationEntity = {
        movies: [
          {
            title: "Movie 1",
            director: "Director 1",
            actors: ["Actor 1"],
            releaseYear: 2020,
            streamingPlatform: "Platform 1",
            imdbRating: 7.5,
            synopsis: "Synopsis 1",
            whySuggestion: "Reason to watch 1",
            durationInMinutes: 120,
          },
        ],
      };

      vi.mocked(langchain.callWithStructuredOutput).mockResolvedValue(
        mockLlmResponse
      );

      const result = await provider.getStructuredMoviesRecommendation(
        userMessage,
        chatHistory
      );

      expect(langchain.prompt.parseChatHistory).toHaveBeenCalled();
      expect(langchain.callWithStructuredOutput).toHaveBeenCalledWith({
        model: model,
        prompt: expect.any(String),
        schema: MovieRecommendationSchema,
      });
      expect(result).toEqual(mockLlmResponse);
    });

    it("should throw WrongMovieSchemaFromLlmException if LLM response is invalid", async () => {
      const userMessage = "I want a comedy movie";
      const chatHistory: ChatHistoryEntity = [];
      const invalidLlmResponse = { movies: [{ title: 123 }] }; // Invalid schema

      vi.mocked(langchain.callWithStructuredOutput).mockResolvedValue(
        invalidLlmResponse
      );

      await expect(
        provider.getStructuredMoviesRecommendation(userMessage, chatHistory)
      ).rejects.toThrow(WrongMovieSchemaFromLlmException);
    });
  });

  describe("getChatResponse", () => {
    it("should return a chat response based on movie recommendations", async () => {
      const movies: MovieRecommendationEntity = {
        movies: [
          {
            title: "Movie 1",
            director: "Director 1",
            actors: ["Actor 1"],
            releaseYear: 2020,
            streamingPlatform: "Platform 1",
            imdbRating: 7.5,
            synopsis: "Synopsis 1",
            whySuggestion: "Reason to watch 1",
            durationInMinutes: 120,
          },
        ],
      };
      const userMessage = "Tell me more about these movies";
      const chatHistory: ChatHistoryEntity = [];
      const mockModelResponse = {
        content: "Here are some great movies!",
      } as unknown as AIMessageChunk;

      vi.mocked(model.invoke).mockResolvedValue(mockModelResponse);

      const result = await provider.getChatResponse(
        movies,
        userMessage,
        chatHistory
      );

      expect(langchain.prompt.parseChatHistory).toHaveBeenCalled();
      expect(model.invoke).toHaveBeenCalledWith(expect.any(String));
      expect(result).toBe(mockModelResponse.content);
    });
  });
});
