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
});
