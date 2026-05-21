import { vi, Mock } from "vitest";
import { LangchainMoviesQueryExamplesProvider } from "./langchain-movies-query-examples.provider";
import { Langchain } from "@/lib/langchain/langchain";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { MovieQueryExamplesSchema } from "../../domain/entities/movie-query-examples.entity";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";

describe("LangchainMoviesQueryExamplesProvider", () => {
  let mockLangchain: Langchain;
  let mockModel: BaseChatModel;
  let provider: LangchainMoviesQueryExamplesProvider;

  beforeEach(() => {
    mockLangchain = {
      prompt: {
        create: vi.fn().mockReturnValue("mocked_prompt"),
      },
      callWithStructuredOutput: vi.fn() as Mock,
    } as unknown as Langchain;

    mockModel = {} as BaseChatModel; // BaseChatModel is an interface, no need for specific methods for this test

    provider = new LangchainMoviesQueryExamplesProvider(
      mockLangchain,
      mockModel
    );
  });

  it("should call langchain methods and return parsed query examples", async () => {
    const mockResponse = {
      moviesQueryExamples: ["example1", "example2"],
    };

    vi.spyOn(MovieQueryExamplesSchema, "safeParse").mockReturnValue({
      success: true,
      data: mockResponse,
    } as any);

    (mockLangchain.callWithStructuredOutput as Mock).mockResolvedValue(
      mockResponse
    );

    const result = await provider.getQueryExamples();

    expect(mockLangchain.prompt.create).toHaveBeenCalledTimes(1);
    expect(mockLangchain.prompt.create).toHaveBeenCalledWith({
      userMessage: expect.any(String),
    });
    expect(mockLangchain.callWithStructuredOutput).toHaveBeenCalledTimes(1);
    expect(mockLangchain.callWithStructuredOutput).toHaveBeenCalledWith({
      model: mockModel,
      prompt: "mocked_prompt",
      schema: MovieQueryExamplesSchema,
    });
    expect(MovieQueryExamplesSchema.safeParse).toHaveBeenCalledWith(
      mockResponse
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw WrongMovieSchemaFromLlmException if schema parsing fails", async () => {
    vi.spyOn(MovieQueryExamplesSchema, "safeParse").mockReturnValue({
      success: false,
      error: new Error("Parsing error"),
    } as any);
    (mockLangchain.callWithStructuredOutput as Mock).mockResolvedValue({});

    await expect(provider.getQueryExamples()).rejects.toThrow(
      WrongMovieSchemaFromLlmException
    );
  });
});
