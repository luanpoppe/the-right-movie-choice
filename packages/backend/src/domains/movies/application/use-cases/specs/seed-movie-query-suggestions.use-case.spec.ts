import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "@/lib/logger/logger";
import { MovieQuerySuggestionPoolConstants } from "../../../domain/movie-query-suggestion-pool.constants";
import type { IMovieQuerySuggestionBatchProvider } from "../../../domain/providers/movie-query-suggestion-batch.provider";
import type { IMovieQuerySuggestionRepository } from "../../../domain/repositories/movie-query-suggestion.repository";
import { SeedMovieQuerySuggestionsUseCase } from "../seed-movie-query-suggestions.use-case";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("SeedMovieQuerySuggestionsUseCase", () => {
  let movieQuerySuggestionRepository: IMovieQuerySuggestionRepository;
  let batchProvider: IMovieQuerySuggestionBatchProvider;
  let useCase: SeedMovieQuerySuggestionsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    movieQuerySuggestionRepository = {
      count: vi.fn(),
      listTexts: vi.fn(),
      insertManySkipDuplicates: vi.fn(),
    };

    batchProvider = {
      generateBatch: vi.fn(),
    };

    useCase = new SeedMovieQuerySuggestionsUseCase(
      movieQuerySuggestionRepository,
      batchProvider,
    );
  });

  it("pool cheio não chama IA nem insert", async () => {
    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(
      MovieQuerySuggestionPoolConstants.POOL_SIZE,
    );

    await useCase.execute();

    expect(batchProvider.generateBatch).not.toHaveBeenCalled();
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).not.toHaveBeenCalled();
    expect(Logger.info).toHaveBeenCalledWith(
      "Movie query suggestion pool already full — seed skipped",
      expect.objectContaining({
        poolCount: MovieQuerySuggestionPoolConstants.POOL_SIZE,
      }),
    );
  });

  it("pool parcial chama generateBatch com batchSize e existingTexts corretos", async () => {
    const existingTexts = ["Sci-Fi movies from the 90s"];
    const generatedTexts = Array.from({ length: 25 }, (_, index) => `New ${index}`);
    const poolCountBefore = 37;

    vi.mocked(movieQuerySuggestionRepository.count)
      .mockResolvedValueOnce(poolCountBefore)
      .mockResolvedValueOnce(MovieQuerySuggestionPoolConstants.POOL_SIZE);
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue(
      existingTexts,
    );
    vi.mocked(batchProvider.generateBatch).mockResolvedValue(generatedTexts);
    vi.mocked(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).mockResolvedValue(21);

    await useCase.execute();

    expect(batchProvider.generateBatch).toHaveBeenCalledTimes(1);
    expect(batchProvider.generateBatch).toHaveBeenCalledWith(25, existingTexts);
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).toHaveBeenCalledWith(generatedTexts);
  });

  it("falha da IA após 3 tentativas relança erro sem desfazer batch anterior", async () => {
    const firstBatchTexts = Array.from({ length: 25 }, (_, index) => `Batch1 ${index}`);
    const batchError = new Error("IA timeout");

    vi.mocked(movieQuerySuggestionRepository.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(25)
      .mockResolvedValueOnce(25);
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue([]);
    vi.mocked(batchProvider.generateBatch)
      .mockResolvedValueOnce(firstBatchTexts)
      .mockRejectedValueOnce(batchError)
      .mockRejectedValueOnce(batchError)
      .mockRejectedValueOnce(batchError);
    vi.mocked(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).mockResolvedValue(25);

    await expect(useCase.execute()).rejects.toThrow("IA timeout");

    expect(batchProvider.generateBatch).toHaveBeenCalledTimes(4);
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).toHaveBeenCalledTimes(1);
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).toHaveBeenCalledWith(firstBatchTexts);
    expect(Logger.warn).toHaveBeenCalledTimes(2);
    expect(Logger.error).toHaveBeenCalledWith(
      "Movie query suggestion batch failed after all attempts",
      expect.objectContaining({ attempt: 3, maxAttempts: 3 }),
    );
  });

  it("lote com duplicatas parciais não reexecuta o batch", async () => {
    const existingTexts = ["Action movies with a twist"];
    const generatedTexts = Array.from({ length: 25 }, (_, index) => `Dup ${index}`);

    vi.mocked(movieQuerySuggestionRepository.count)
      .mockResolvedValueOnce(37)
      .mockResolvedValueOnce(MovieQuerySuggestionPoolConstants.POOL_SIZE);
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue(
      existingTexts,
    );
    vi.mocked(batchProvider.generateBatch).mockResolvedValue(generatedTexts);
    vi.mocked(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).mockResolvedValue(21);

    await useCase.execute();

    expect(batchProvider.generateBatch).toHaveBeenCalledTimes(1);
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).toHaveBeenCalledTimes(1);
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).toHaveBeenCalledWith(generatedTexts);
    expect(Logger.warn).not.toHaveBeenCalled();
  });
});
