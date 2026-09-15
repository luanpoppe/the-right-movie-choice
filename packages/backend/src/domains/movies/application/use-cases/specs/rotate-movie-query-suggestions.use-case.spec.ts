import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "@/lib/logger/logger";
import { MovieQuerySuggestionPoolConstants } from "../../../domain/movie-query-suggestion-pool.constants";
import type { IMovieQuerySuggestionBatchProvider } from "../../../domain/providers/movie-query-suggestion-batch.provider";
import type { IMovieQuerySuggestionRepository } from "../../../domain/repositories/movie-query-suggestion.repository";
import { RotateMovieQuerySuggestionsUseCase } from "../rotate-movie-query-suggestions.use-case";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("RotateMovieQuerySuggestionsUseCase", () => {
  let movieQuerySuggestionRepository: IMovieQuerySuggestionRepository;
  let batchProvider: IMovieQuerySuggestionBatchProvider;
  let useCase: RotateMovieQuerySuggestionsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    movieQuerySuggestionRepository = {
      count: vi.fn(),
      listTexts: vi.fn(),
      insertManySkipDuplicates: vi.fn(),
      pickRandomTexts: vi.fn(),
      rotatePoolAtomically: vi.fn(),
      withSeedLock: vi.fn((operation) => operation()),
    };

    batchProvider = {
      generateBatch: vi.fn(),
    };

    useCase = new RotateMovieQuerySuggestionsUseCase(
      movieQuerySuggestionRepository,
      batchProvider,
    );
  });

  it("REQ-2: pool com 99 completa 1 via IA e rotaciona na mesma execução", async () => {
    const existingTextsBeforeTopUp = Array.from(
      { length: 99 },
      (_, index) => `Existing ${index}`,
    );
    const topUpTexts = ["New top-up suggestion"];
    const rotationTexts = Array.from(
      { length: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE },
      (_, index) => `Rotation ${index}`,
    );

    vi.mocked(movieQuerySuggestionRepository.count)
      .mockResolvedValueOnce(99)
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(100);
    vi.mocked(movieQuerySuggestionRepository.listTexts)
      .mockResolvedValueOnce(existingTextsBeforeTopUp)
      .mockResolvedValueOnce(existingTextsBeforeTopUp);
    vi.mocked(batchProvider.generateBatch)
      .mockResolvedValueOnce(topUpTexts)
      .mockResolvedValueOnce(rotationTexts);
    vi.mocked(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).mockResolvedValue(1);
    vi.mocked(movieQuerySuggestionRepository.rotatePoolAtomically).mockResolvedValue();

    await useCase.execute();

    expect(batchProvider.generateBatch).toHaveBeenNthCalledWith(1, 1, existingTextsBeforeTopUp);
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).toHaveBeenCalledWith(topUpTexts);
    expect(batchProvider.generateBatch).toHaveBeenNthCalledWith(
      2,
      MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
      existingTextsBeforeTopUp,
    );
    expect(movieQuerySuggestionRepository.rotatePoolAtomically).toHaveBeenCalledWith(
      rotationTexts,
    );
  });

  it("REQ-2: top-up incompleto não rotaciona", async () => {
    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(99);
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue([]);
    vi.mocked(batchProvider.generateBatch).mockResolvedValue(["Duplicate text"]);
    vi.mocked(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).mockResolvedValue(0);

    await useCase.execute();

    expect(batchProvider.generateBatch).toHaveBeenCalledOnce();
    expect(movieQuerySuggestionRepository.rotatePoolAtomically).not.toHaveBeenCalled();
    expect(Logger.info).toHaveBeenCalledWith(
      "Movie query suggestion pool still below minimum size — rotation skipped",
      expect.objectContaining({ poolCount: 99 }),
    );
  });

  it("REQ-2: top-up parcial (97→99) pede 3 à IA e não rotaciona", async () => {
    const existingTexts = Array.from({ length: 97 }, (_, index) => `Existing ${index}`);
    const topUpTexts = ["New 1", "New 2", "New 3"];

    vi.mocked(movieQuerySuggestionRepository.count)
      .mockResolvedValueOnce(97)
      .mockResolvedValueOnce(99)
      .mockResolvedValueOnce(99);
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue(
      existingTexts,
    );
    vi.mocked(batchProvider.generateBatch).mockResolvedValue(topUpTexts);
    vi.mocked(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).mockResolvedValue(2);

    await useCase.execute();

    expect(batchProvider.generateBatch).toHaveBeenCalledWith(3, existingTexts);
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).toHaveBeenCalledWith(topUpTexts);
    expect(movieQuerySuggestionRepository.rotatePoolAtomically).not.toHaveBeenCalled();
    expect(Logger.info).toHaveBeenCalledWith(
      "Movie query suggestion pool still below minimum size — rotation skipped",
      expect.objectContaining({ poolCount: 99 }),
    );
  });

  it("REQ-6: falha da IA no top-up não insere nem rotaciona", async () => {
    const batchError = new Error("IA timeout");

    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(99);
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue([]);
    vi.mocked(batchProvider.generateBatch)
      .mockRejectedValueOnce(batchError)
      .mockRejectedValueOnce(batchError)
      .mockRejectedValueOnce(batchError);

    await expect(useCase.execute()).rejects.toThrow("IA timeout");

    expect(batchProvider.generateBatch).toHaveBeenCalledTimes(3);
    expect(
      movieQuerySuggestionRepository.insertManySkipDuplicates,
    ).not.toHaveBeenCalled();
    expect(movieQuerySuggestionRepository.rotatePoolAtomically).not.toHaveBeenCalled();
  });

  it("pool com 101 sugestões também rotaciona (+5/−5)", async () => {
    const existingTexts = Array.from({ length: 101 }, (_, index) => `Existing ${index}`);
    const generatedTexts = Array.from(
      { length: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE },
      (_, index) => `New ${index}`,
    );

    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(101);
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue(
      existingTexts,
    );
    vi.mocked(batchProvider.generateBatch).mockResolvedValue(generatedTexts);
    vi.mocked(movieQuerySuggestionRepository.rotatePoolAtomically).mockResolvedValue();

    await useCase.execute();

    expect(batchProvider.generateBatch).toHaveBeenCalledWith(
      MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
      existingTexts,
    );
    expect(movieQuerySuggestionRepository.rotatePoolAtomically).toHaveBeenCalledWith(
      generatedTexts,
    );
  });

  it("REQ-1/3/8: pool cheio gera lote de 5 e rotaciona atomicamente", async () => {
    const existingTexts = Array.from(
      { length: MovieQuerySuggestionPoolConstants.POOL_SIZE },
      (_, index) => `Existing ${index}`,
    );
    const generatedTexts = Array.from(
      { length: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE },
      (_, index) => `New ${index}`,
    );

    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(
      MovieQuerySuggestionPoolConstants.POOL_SIZE,
    );
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue(
      existingTexts,
    );
    vi.mocked(batchProvider.generateBatch).mockResolvedValue(generatedTexts);
    vi.mocked(movieQuerySuggestionRepository.rotatePoolAtomically).mockResolvedValue();

    await useCase.execute();

    expect(movieQuerySuggestionRepository.listTexts).toHaveBeenCalledTimes(1);
    expect(batchProvider.generateBatch).toHaveBeenCalledTimes(1);
    expect(batchProvider.generateBatch).toHaveBeenCalledWith(
      MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
      existingTexts,
    );
    expect(movieQuerySuggestionRepository.rotatePoolAtomically).toHaveBeenCalledWith(
      generatedTexts,
    );
    expect(Logger.info).toHaveBeenCalledWith(
      "Starting movie query suggestion pool rotation",
      expect.objectContaining({
        poolCount: MovieQuerySuggestionPoolConstants.POOL_SIZE,
      }),
    );
    expect(Logger.info).toHaveBeenCalledWith(
      "Movie query suggestion pool rotation finished",
      expect.objectContaining({
        rotatedCount: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
      }),
    );
  });

  it("REQ-6: falha da IA após 3 tentativas não chama rotatePoolAtomically", async () => {
    const batchError = new Error("IA timeout");

    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(
      MovieQuerySuggestionPoolConstants.POOL_SIZE,
    );
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue([]);
    vi.mocked(batchProvider.generateBatch)
      .mockRejectedValueOnce(batchError)
      .mockRejectedValueOnce(batchError)
      .mockRejectedValueOnce(batchError);

    await expect(useCase.execute()).rejects.toThrow("IA timeout");

    expect(batchProvider.generateBatch).toHaveBeenCalledTimes(3);
    expect(movieQuerySuggestionRepository.rotatePoolAtomically).not.toHaveBeenCalled();
    expect(Logger.warn).toHaveBeenCalledTimes(2);
    expect(Logger.error).toHaveBeenCalledWith(
      "Movie query suggestion rotation batch failed after all attempts",
      expect.objectContaining({ attempt: 3, maxAttempts: 3 }),
    );
  });

  it("REQ-3: lote IA com menos de 5 textos aborta antes de rotatePoolAtomically", async () => {
    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(
      MovieQuerySuggestionPoolConstants.POOL_SIZE,
    );
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue([]);
    vi.mocked(batchProvider.generateBatch).mockResolvedValue([
      "Suggestion one",
      "Suggestion two",
      "Suggestion three",
    ]);

    await expect(useCase.execute()).rejects.toThrow(
      "Pool rotation aborted: expected 5 texts from IA, got 3",
    );

    expect(movieQuerySuggestionRepository.rotatePoolAtomically).not.toHaveBeenCalled();
    expect(Logger.error).toHaveBeenCalledWith(
      "Movie query suggestion rotation aborted — incomplete IA batch",
      expect.objectContaining({ expected: 5, received: 3 }),
    );
  });

  it("REQ-4/5: rotatePoolAtomically com lote incompleto propaga erro", async () => {
    const rotationError = new Error(
      "Pool rotation aborted: expected 5 inserts, got 3",
    );

    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(
      MovieQuerySuggestionPoolConstants.POOL_SIZE,
    );
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue([]);
    vi.mocked(batchProvider.generateBatch).mockResolvedValue(
      Array.from(
        { length: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE },
        (_, index) => `New ${index}`,
      ),
    );
    vi.mocked(movieQuerySuggestionRepository.rotatePoolAtomically).mockRejectedValue(
      rotationError,
    );

    await expect(useCase.execute()).rejects.toThrow(
      "Pool rotation aborted: expected 5 inserts, got 3",
    );

    expect(movieQuerySuggestionRepository.rotatePoolAtomically).toHaveBeenCalledTimes(1);
  });

  it("REQ-10: withSeedLock envolve execute", async () => {
    vi.mocked(movieQuerySuggestionRepository.count).mockResolvedValue(
      MovieQuerySuggestionPoolConstants.POOL_SIZE,
    );
    vi.mocked(movieQuerySuggestionRepository.listTexts).mockResolvedValue([]);
    vi.mocked(batchProvider.generateBatch).mockResolvedValue(
      Array.from(
        { length: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE },
        (_, index) => `New ${index}`,
      ),
    );
    vi.mocked(movieQuerySuggestionRepository.rotatePoolAtomically).mockResolvedValue();

    await useCase.execute();

    expect(movieQuerySuggestionRepository.withSeedLock).toHaveBeenCalledTimes(1);
  });
});
