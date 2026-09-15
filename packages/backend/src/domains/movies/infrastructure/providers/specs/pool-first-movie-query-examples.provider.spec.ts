import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "@/lib/logger/logger";
import { IMovieQueryExampleProvider } from "../../../application/providers/movie-query-example.provider";
import {
  MOVIE_QUERY_EXAMPLES_COUNT,
  MovieQueryExamplesEntity,
} from "../../../domain/entities/movie-query-examples.entity";
import { IMovieQuerySuggestionRepository } from "../../../domain/repositories/movie-query-suggestion.repository";
import { PoolFirstMovieQueryExamplesProvider } from "../pool-first-movie-query-examples.provider";

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

  static entityFromTexts(texts: string[]): MovieQueryExamplesEntity {
    const queryExamples = texts.map((text) => ({ queryExample: text }));
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

describe("PoolFirstMovieQueryExamplesProvider", () => {
  let repository: IMovieQuerySuggestionRepository;
  let aiFallbackProvider: IMovieQueryExampleProvider;
  let provider: PoolFirstMovieQueryExamplesProvider;
  let count: ReturnType<typeof vi.fn>;
  let pickRandomTexts: ReturnType<typeof vi.fn>;
  let getQueryExamplesFromAi: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    count = vi.fn();
    pickRandomTexts = vi.fn();
    getQueryExamplesFromAi = vi.fn();
    repository = {
      count,
      listTexts: vi.fn(),
      insertManySkipDuplicates: vi.fn(),
      pickRandomTexts,
      withSeedLock: vi.fn(),
    };
    aiFallbackProvider = {
      getQueryExamples: getQueryExamplesFromAi,
    };
    provider = new PoolFirstMovieQueryExamplesProvider(
      repository,
      aiFallbackProvider,
    );
  });

  describe("getQueryExamples", () => {
    it("count=47, pickRandom retorna 3 textos → retorna entity do pool, IA não chamada", async () => {
      const poolTexts = [
        "Sci-Fi movies from the 90s",
        "Action movies with a twist",
        "Horror films set in space",
      ];
      const expectedEntity = MovieQueryExamplesFixtures.entityFromTexts(poolTexts);
      count.mockResolvedValue(47);
      pickRandomTexts.mockResolvedValue(poolTexts);

      const result = await provider.getQueryExamples();

      expect(result).toEqual(expectedEntity);
      expect(count).toHaveBeenCalledOnce();
      expect(pickRandomTexts).toHaveBeenCalledWith(MOVIE_QUERY_EXAMPLES_COUNT);
      expect(getQueryExamplesFromAi).not.toHaveBeenCalled();
    });

    it("count=0 → delega IA, log de fallback", async () => {
      const aiEntity = MovieQueryExamplesFixtures.validEntity();
      count.mockResolvedValue(0);
      getQueryExamplesFromAi.mockResolvedValue(aiEntity);

      const result = await provider.getQueryExamples();

      expect(result).toEqual(aiEntity);
      expect(getQueryExamplesFromAi).toHaveBeenCalledOnce();
      expect(pickRandomTexts).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalled();
      const infoCalls = vi.mocked(Logger.info).mock.calls;
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        infoCalls,
        1,
      );
      expect(infoContext.fallbackReason).toBe("insufficient_pool");
      expect(infoContext.poolCount).toBe(0);
    });

    it("count=1 → delega IA (pool parcial ignorado)", async () => {
      const aiEntity = MovieQueryExamplesFixtures.validEntity();
      count.mockResolvedValue(1);
      getQueryExamplesFromAi.mockResolvedValue(aiEntity);

      const result = await provider.getQueryExamples();

      expect(result).toEqual(aiEntity);
      expect(getQueryExamplesFromAi).toHaveBeenCalledOnce();
      expect(pickRandomTexts).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalled();
      const infoCalls = vi.mocked(Logger.info).mock.calls;
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        infoCalls,
        1,
      );
      expect(infoContext.fallbackReason).toBe("insufficient_pool");
      expect(infoContext.poolCount).toBe(1);
    });

    it("count=2 → delega IA (pool parcial ignorado)", async () => {
      const aiEntity = MovieQueryExamplesFixtures.validEntity();
      count.mockResolvedValue(2);
      getQueryExamplesFromAi.mockResolvedValue(aiEntity);

      const result = await provider.getQueryExamples();

      expect(result).toEqual(aiEntity);
      expect(getQueryExamplesFromAi).toHaveBeenCalledOnce();
      expect(pickRandomTexts).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalled();
      const infoCalls = vi.mocked(Logger.info).mock.calls;
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        infoCalls,
        1,
      );
      expect(infoContext.fallbackReason).toBe("insufficient_pool");
      expect(infoContext.poolCount).toBe(2);
    });

    it("count lança erro de postgres → delega IA", async () => {
      const aiEntity = MovieQueryExamplesFixtures.validEntity();
      count.mockRejectedValue(new Error("connection refused"));
      getQueryExamplesFromAi.mockResolvedValue(aiEntity);

      const result = await provider.getQueryExamples();

      expect(result).toEqual(aiEntity);
      expect(getQueryExamplesFromAi).toHaveBeenCalledOnce();
      expect(pickRandomTexts).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalled();
      const infoCalls = vi.mocked(Logger.info).mock.calls;
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        infoCalls,
        1,
      );
      expect(infoContext.fallbackReason).toBe("database_error");
      expect(infoContext.error).toBe("connection refused");
    });

    it("REQ-4: textos retornados do pool são distintos entre si", async () => {
      const poolTexts = ["Alpha", "Beta", "Gamma"];
      count.mockResolvedValue(5);
      pickRandomTexts.mockResolvedValue(poolTexts);

      const result = await provider.getQueryExamples();
      const texts = result.queryExamples.map((item) => item.queryExample);
      const uniqueTexts = new Set(texts);

      expect(texts).toHaveLength(MOVIE_QUERY_EXAMPLES_COUNT);
      expect(uniqueTexts.size).toBe(MOVIE_QUERY_EXAMPLES_COUNT);
      expect(getQueryExamplesFromAi).not.toHaveBeenCalled();
    });

    it("count=5 mas pickRandom retorna menos de 3 textos → delega IA", async () => {
      const aiEntity = MovieQueryExamplesFixtures.validEntity();
      count.mockResolvedValue(5);
      pickRandomTexts.mockResolvedValue(["Only", "Two"]);
      getQueryExamplesFromAi.mockResolvedValue(aiEntity);

      const result = await provider.getQueryExamples();

      expect(result).toEqual(aiEntity);
      expect(getQueryExamplesFromAi).toHaveBeenCalledOnce();
      expect(Logger.info).toHaveBeenCalled();
      const infoCalls = vi.mocked(Logger.info).mock.calls;
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        infoCalls,
        1,
      );
      expect(infoContext.fallbackReason).toBe("invalid_pool_response");
      expect(infoContext.returnedCount).toBe(2);
    });

    it("count=5 mas pickRandom lança erro → delega IA", async () => {
      const aiEntity = MovieQueryExamplesFixtures.validEntity();
      count.mockResolvedValue(5);
      pickRandomTexts.mockRejectedValue(new Error("postgres timeout"));
      getQueryExamplesFromAi.mockResolvedValue(aiEntity);

      const result = await provider.getQueryExamples();

      expect(result).toEqual(aiEntity);
      expect(getQueryExamplesFromAi).toHaveBeenCalledOnce();
      expect(Logger.info).toHaveBeenCalled();
      const infoCalls = vi.mocked(Logger.info).mock.calls;
      const infoContext = VitestMockCallUtils.nthArg<Record<string, unknown>>(
        infoCalls,
        1,
      );
      expect(infoContext.fallbackReason).toBe("database_error");
      expect(infoContext.error).toBe("postgres timeout");
    });

    it("count=3 exato → retorna os 3 do pool", async () => {
      const poolTexts = ["A", "B", "C"];
      const expectedEntity = MovieQueryExamplesFixtures.entityFromTexts(poolTexts);
      count.mockResolvedValue(3);
      pickRandomTexts.mockResolvedValue(poolTexts);

      const result = await provider.getQueryExamples();

      expect(result).toEqual(expectedEntity);
      expect(pickRandomTexts).toHaveBeenCalledWith(MOVIE_QUERY_EXAMPLES_COUNT);
      expect(getQueryExamplesFromAi).not.toHaveBeenCalled();
    });

    it("edge: leituras concorrentes podem retornar conjuntos diferentes do pool", async () => {
      const firstTexts = ["A", "B", "C"];
      const secondTexts = ["D", "E", "F"];
      count.mockResolvedValue(10);
      pickRandomTexts
        .mockResolvedValueOnce(firstTexts)
        .mockResolvedValueOnce(secondTexts);

      const firstPromise = provider.getQueryExamples();
      const secondPromise = provider.getQueryExamples();
      const results = await Promise.all([firstPromise, secondPromise]);

      expect(results[0]).toEqual(
        MovieQueryExamplesFixtures.entityFromTexts(firstTexts),
      );
      expect(results[1]).toEqual(
        MovieQueryExamplesFixtures.entityFromTexts(secondTexts),
      );
      expect(getQueryExamplesFromAi).not.toHaveBeenCalled();
      expect(count).toHaveBeenCalledTimes(2);
      expect(pickRandomTexts).toHaveBeenCalledTimes(2);
    });
  });
});
