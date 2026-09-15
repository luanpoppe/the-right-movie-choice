import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { MovieQuerySuggestionPoolConstants } from "../../../../domain/movie-query-suggestion-pool.constants";
import { PrismaMovieQuerySuggestionRepository } from "../prisma-movie-query-suggestion.repository";

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    movieQuerySuggestion: {
      count: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $executeRawUnsafe: vi.fn(),
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PrismaMovieQuerySuggestionRepository", () => {
  let repository: PrismaMovieQuerySuggestionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaMovieQuerySuggestionRepository();
  });

  describe("count", () => {
    it("retorna o total de sugestões no pool", async () => {
      vi.mocked(prisma.movieQuerySuggestion.count).mockResolvedValue(37);

      const total = await repository.count();

      expect(total).toBe(37);
      expect(prisma.movieQuerySuggestion.count).toHaveBeenCalledOnce();
    });
  });

  describe("listTexts", () => {
    it("retorna textos de exibição em ordem de criação", async () => {
      vi.mocked(prisma.movieQuerySuggestion.findMany).mockResolvedValue([
        { text: "Sci-Fi movies from the 90s" },
        { text: "Action movies with a twist" },
      ] as never);

      const texts = await repository.listTexts();

      expect(texts).toEqual([
        "Sci-Fi movies from the 90s",
        "Action movies with a twist",
      ]);
      expect(prisma.movieQuerySuggestion.findMany).toHaveBeenCalledWith({
        select: { text: true },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("insertManySkipDuplicates", () => {
    it("REQ-5: normaliza e usa skipDuplicates no Prisma", async () => {
      vi.mocked(prisma.movieQuerySuggestion.createMany).mockResolvedValue({
        count: 1,
      });

      const inserted = await repository.insertManySkipDuplicates([
        "  Action movies with a twist  ",
      ]);

      expect(inserted).toBe(1);
      expect(prisma.movieQuerySuggestion.createMany).toHaveBeenCalledWith({
        data: [
          {
            text: "Action movies with a twist",
            textNormalized: "action movies with a twist",
          },
        ],
        skipDuplicates: true,
      });
    });

    it("ignora textos vazios após trim sem chamar createMany", async () => {
      const inserted = await repository.insertManySkipDuplicates(["   ", ""]);

      expect(inserted).toBe(0);
      expect(prisma.movieQuerySuggestion.createMany).not.toHaveBeenCalled();
    });

    it("edge: falha do postgres no createMany propaga erro", async () => {
      const dbError = new Error("connection lost");
      vi.mocked(prisma.movieQuerySuggestion.createMany).mockRejectedValue(
        dbError,
      );

      await expect(
        repository.insertManySkipDuplicates(["Sci-Fi movies from the 90s"]),
      ).rejects.toThrow("connection lost");
    });

    it("REQ-8: retorna apenas a contagem inserida quando há duplicatas", async () => {
      vi.mocked(prisma.movieQuerySuggestion.createMany).mockResolvedValue({
        count: 21,
      });

      const texts = Array.from(
        { length: 25 },
        (_, index) => `Suggestion ${index}`,
      );
      const inserted = await repository.insertManySkipDuplicates(texts);

      expect(inserted).toBe(21);
      expect(prisma.movieQuerySuggestion.createMany).toHaveBeenCalledOnce();
    });
  });

  describe("pickRandomTexts", () => {
    it("retorna textos aleatórios do pool via raw query", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        { text: "Sci-Fi movies from the 90s" },
        { text: "Action movies with a twist" },
      ]);

      const texts = await repository.pickRandomTexts(2);

      expect(texts).toEqual([
        "Sci-Fi movies from the 90s",
        "Action movies with a twist",
      ]);
      expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    });

    it("REQ-1: preserva casing original dos textos do banco", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        { text: "Sci-Fi MOVIES from the 90s" },
        { text: "aCtIoN movies with a Twist" },
        { text: "horror Films Set In Space" },
      ]);

      const texts = await repository.pickRandomTexts(3);

      expect(texts).toEqual([
        "Sci-Fi MOVIES from the 90s",
        "aCtIoN movies with a Twist",
        "horror Films Set In Space",
      ]);
      expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    });

    it("retorna array vazio sem query quando limit é inválido", async () => {
      const textsZero = await repository.pickRandomTexts(0);
      const textsNegative = await repository.pickRandomTexts(-3);

      expect(textsZero).toEqual([]);
      expect(textsNegative).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("edge: falha do postgres no queryRaw propaga erro", async () => {
      const dbError = new Error("connection lost");
      vi.mocked(prisma.$queryRaw).mockRejectedValue(dbError);

      await expect(repository.pickRandomTexts(5)).rejects.toThrow(
        "connection lost",
      );
    });
  });

  describe("withSeedLock", () => {
    it("adquire advisory lock transacional na mesma sessão do postgres", async () => {
      const txExecuteRawUnsafe = vi.fn().mockResolvedValue(undefined);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const transactionClient = {
          $executeRawUnsafe: txExecuteRawUnsafe,
        };
        return callback(transactionClient as never);
      });

      const operationResult = "ok";
      const operation = vi.fn().mockResolvedValue(operationResult);

      const result = await repository.withSeedLock(operation);

      expect(result).toBe(operationResult);
      expect(prisma.$transaction).toHaveBeenCalledOnce();
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        {
          timeout: MovieQuerySuggestionPoolConstants.SEED_LOCK_TRANSACTION_TIMEOUT_MS,
        },
      );
      expect(txExecuteRawUnsafe).toHaveBeenCalledWith(
        "SELECT pg_advisory_xact_lock(847291034)",
      );
      expect(operation).toHaveBeenCalledOnce();
    });
  });

  describe("rotatePoolAtomically", () => {
    let createMany: ReturnType<typeof vi.fn>;
    let findMany: ReturnType<typeof vi.fn>;
    let deleteMany: ReturnType<typeof vi.fn>;
    let transactionClient: {
      movieQuerySuggestion: {
        createMany: ReturnType<typeof vi.fn>;
        findMany: ReturnType<typeof vi.fn>;
        deleteMany: ReturnType<typeof vi.fn>;
      };
    };

    const rotationTexts = [
      "New suggestion one",
      "New suggestion two",
      "New suggestion three",
      "New suggestion four",
      "New suggestion five",
    ];

    beforeEach(() => {
      createMany = vi.fn();
      findMany = vi.fn();
      deleteMany = vi.fn();
      transactionClient = {
        movieQuerySuggestion: {
          createMany,
          findMany,
          deleteMany,
        },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback(transactionClient as never);
      });
      createMany.mockResolvedValue({
        count: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
      });
      findMany.mockResolvedValue([
        { id: "id-t1" },
        { id: "id-t2" },
        { id: "id-t3" },
        { id: "id-t4" },
        { id: "id-t5" },
      ]);
      deleteMany.mockResolvedValue({ count: 5 });
    });

    it("REQ-4: insere e remove lote na mesma transação quando todos são inseridos", async () => {
      await repository.rotatePoolAtomically(rotationTexts);

      expect(prisma.$transaction).toHaveBeenCalledOnce();
      expect(createMany).toHaveBeenCalledWith({
        data: rotationTexts.map((text) => ({
          text,
          textNormalized: text.toLowerCase(),
        })),
        skipDuplicates: true,
      });
      expect(findMany).toHaveBeenCalledWith({
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
      });
      expect(deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["id-t1", "id-t2", "id-t3", "id-t4", "id-t5"] } },
      });
      expect(Logger.info).toHaveBeenCalledWith(
        "Movie query suggestion pool rotated",
        {
          inserted: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
          removed: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
        },
      );
    });

    it("REQ-9: remove os registros mais antigos por createdAt", async () => {
      await repository.rotatePoolAtomically(rotationTexts);

      expect(findMany).toHaveBeenCalledWith({
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: MovieQuerySuggestionPoolConstants.ROTATION_BATCH_SIZE,
      });
      expect(deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["id-t1", "id-t2", "id-t3", "id-t4", "id-t5"] } },
      });
    });

    it("REQ-5: aborta quando insert incompleto por duplicatas", async () => {
      createMany.mockResolvedValue({ count: 3 });

      await expect(repository.rotatePoolAtomically(rotationTexts)).rejects.toThrow(
        "Pool rotation aborted: expected 5 inserts, got 3",
      );

      expect(deleteMany).not.toHaveBeenCalled();
      expect(Logger.warn).toHaveBeenCalledWith(
        "Pool rotation aborted — incomplete batch insert",
        { expected: 5, inserted: 3 },
      );
    });

    it("REQ-7: aborta quando nenhum texto é inserido", async () => {
      createMany.mockResolvedValue({ count: 0 });

      await expect(repository.rotatePoolAtomically(rotationTexts)).rejects.toThrow(
        "Pool rotation aborted: expected 5 inserts, got 0",
      );

      expect(deleteMany).not.toHaveBeenCalled();
    });

    it("aborta quando textos ficam vazios após normalização", async () => {
      const textsWithEmpty = ["Valid text", "   ", "Another", "ok", "fine"];

      await expect(
        repository.rotatePoolAtomically(textsWithEmpty),
      ).rejects.toThrow(
        "Pool rotation aborted: expected 5 valid texts, got 4",
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("edge: falha do postgres na transação propaga erro", async () => {
      const dbError = new Error("connection lost");
      vi.mocked(prisma.$transaction).mockRejectedValue(dbError);

      await expect(repository.rotatePoolAtomically(rotationTexts)).rejects.toThrow(
        "connection lost",
      );
    });

    it("edge: falha do postgres no deleteMany dentro da transação propaga erro", async () => {
      const deleteError = new Error("delete constraint violation");
      deleteMany.mockRejectedValue(deleteError);

      await expect(repository.rotatePoolAtomically(rotationTexts)).rejects.toThrow(
        "delete constraint violation",
      );

      expect(createMany).toHaveBeenCalled();
      expect(deleteMany).toHaveBeenCalled();
    });
  });
});
