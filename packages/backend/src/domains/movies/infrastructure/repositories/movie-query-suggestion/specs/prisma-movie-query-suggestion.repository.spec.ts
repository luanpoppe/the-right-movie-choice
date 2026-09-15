import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaMovieQuerySuggestionRepository } from "../prisma-movie-query-suggestion.repository";

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    movieQuerySuggestion: {
      count: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    $executeRawUnsafe: vi.fn(),
    $queryRaw: vi.fn(),
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
    it("adquire e libera advisory lock do postgres", async () => {
      const operationResult = "ok";
      const operation = vi.fn().mockResolvedValue(operationResult);

      const result = await repository.withSeedLock(operation);

      expect(result).toBe(operationResult);
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(2);
      expect(prisma.$executeRawUnsafe).toHaveBeenNthCalledWith(
        1,
        "SELECT pg_advisory_lock(847291034)",
      );
      expect(prisma.$executeRawUnsafe).toHaveBeenNthCalledWith(
        2,
        "SELECT pg_advisory_unlock(847291034)",
      );
      expect(operation).toHaveBeenCalledOnce();
    });
  });
});
