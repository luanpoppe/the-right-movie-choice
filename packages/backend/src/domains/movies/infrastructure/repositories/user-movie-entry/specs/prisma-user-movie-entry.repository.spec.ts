import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import type { UserMovieEntryPatch } from "../../../../domain/entities/user-movie-entry.entity";
import { UserMovieEntryValidationException } from "../../../../domain/exceptions/user-movie-entry-validation.exception";
import { PrismaUserMovieEntryRepository } from "../prisma-user-movie-entry.repository";

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    userMovieEntry: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
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

class UserMovieEntryRepositoryFixtures {
  static prismaRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      userId: 42,
      tmdbId: 157336,
      movieId: null,
      watched: false,
      favorite: false,
      inWatchlist: false,
      rating: null,
      watchedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }

  static entityFromRow(row: ReturnType<typeof UserMovieEntryRepositoryFixtures.prismaRow>) {
    return {
      userId: row.userId,
      tmdbId: row.tmdbId,
      movieId: row.movieId,
      watched: row.watched,
      favorite: row.favorite,
      inWatchlist: row.inWatchlist,
      rating: row.rating,
      watchedAt: row.watchedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

describe("PrismaUserMovieEntryRepository", () => {
  let repository: PrismaUserMovieEntryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaUserMovieEntryRepository();
  });

  describe("findByUserAndTmdbId", () => {
    it("retorna entidade quando existe linha", async () => {
      const row = UserMovieEntryRepositoryFixtures.prismaRow({
        watched: true,
        favorite: false,
        inWatchlist: true,
        rating: 9,
        watchedAt: new Date("2024-06-15T20:00:00.000Z"),
      });
      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(row as never);

      const result = await repository.findByUserAndTmdbId(42, 157336);

      expect(prisma.userMovieEntry.findUnique).toHaveBeenCalledWith({
        where: {
          userId_tmdbId: { userId: 42, tmdbId: 157336 },
        },
      });
      expect(result).toEqual(UserMovieEntryRepositoryFixtures.entityFromRow(row));
      expect(Logger.debug).toHaveBeenCalledWith("User movie entry find hit", {
        userId: 42,
        tmdbId: 157336,
      });
    });

    it("retorna null quando não há linha", async () => {
      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(null);

      const result = await repository.findByUserAndTmdbId(42, 157336);

      expect(result).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith("User movie entry find miss", {
        userId: 42,
        tmdbId: 157336,
      });
    });
  });

  describe("upsert", () => {
    it("REQ-1 cria entrada com todos os campos", async () => {
      const watchedAt = new Date("2024-06-15T20:00:00.000Z");
      const patch: UserMovieEntryPatch = {
        watched: true,
        favorite: false,
        inWatchlist: true,
        rating: 9,
        watchedAt,
      };
      const createdRow = UserMovieEntryRepositoryFixtures.prismaRow({
        watched: true,
        favorite: false,
        inWatchlist: true,
        rating: 9,
        watchedAt,
      });

      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.userMovieEntry.upsert).mockResolvedValue(createdRow as never);

      const result = await repository.upsert(42, 157336, patch);

      expect(prisma.userMovieEntry.upsert).toHaveBeenCalledWith({
        where: {
          userId_tmdbId: { userId: 42, tmdbId: 157336 },
        },
        create: {
          userId: 42,
          tmdbId: 157336,
          watched: true,
          favorite: false,
          inWatchlist: true,
          rating: 9,
          watchedAt,
          movieId: null,
        },
        update: {
          watched: true,
          favorite: false,
          inWatchlist: true,
          rating: 9,
          watchedAt,
          movieId: null,
        },
      });
      expect(result).toEqual(UserMovieEntryRepositoryFixtures.entityFromRow(createdRow));
      expect(Logger.info).toHaveBeenCalledWith("User movie entry upsert ok", {
        userId: 42,
        tmdbId: 157336,
        watched: true,
        favorite: false,
        inWatchlist: true,
      });
    });

    it("REQ-2 upsert parcial preserva flags não enviados", async () => {
      const existingRow = UserMovieEntryRepositoryFixtures.prismaRow({
        watched: true,
        favorite: true,
        inWatchlist: false,
      });
      const updatedRow = UserMovieEntryRepositoryFixtures.prismaRow({
        watched: true,
        favorite: true,
        inWatchlist: true,
      });
      const patch: UserMovieEntryPatch = { inWatchlist: true };

      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(existingRow as never);
      vi.mocked(prisma.userMovieEntry.upsert).mockResolvedValue(updatedRow as never);

      await repository.upsert(42, 157336, patch);

      expect(prisma.userMovieEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            watched: true,
            favorite: true,
            inWatchlist: true,
          }),
        }),
      );
    });

    it("REQ-3 usa prisma upsert com chave userId_tmdbId", async () => {
      const existingRow = UserMovieEntryRepositoryFixtures.prismaRow({ watched: true });
      const updatedRow = UserMovieEntryRepositoryFixtures.prismaRow({
        watched: true,
        favorite: true,
      });

      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(existingRow as never);
      vi.mocked(prisma.userMovieEntry.upsert).mockResolvedValue(updatedRow as never);

      await repository.upsert(42, 157336, { favorite: true });

      expect(prisma.userMovieEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_tmdbId: { userId: 42, tmdbId: 157336 },
          },
        }),
      );
    });

    it("REQ-4 remove linha quando os três flags ficam false", async () => {
      const existingRow = UserMovieEntryRepositoryFixtures.prismaRow({
        watched: true,
        favorite: false,
        inWatchlist: false,
      });

      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(existingRow as never);

      const result = await repository.upsert(42, 157336, { watched: false });

      expect(prisma.userMovieEntry.delete).toHaveBeenCalledWith({
        where: {
          userId_tmdbId: { userId: 42, tmdbId: 157336 },
        },
      });
      expect(prisma.userMovieEntry.upsert).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(Logger.info).toHaveBeenCalledWith(
        "User movie entry deleted (no active flags)",
        { userId: 42, tmdbId: 157336 },
      );
    });

    it("REQ-4 retorna null sem delete quando não existe linha e flags ficam false", async () => {
      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(null);

      const result = await repository.upsert(42, 157336, { watched: false });

      expect(prisma.userMovieEntry.delete).not.toHaveBeenCalled();
      expect(prisma.userMovieEntry.upsert).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("REQ-5 omitir rating e watchedAt preserva valores existentes", async () => {
      const watchedAt = new Date("2024-06-15T20:00:00.000Z");
      const existingRow = UserMovieEntryRepositoryFixtures.prismaRow({
        watched: true,
        favorite: true,
        inWatchlist: false,
        rating: 8,
        watchedAt,
      });

      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(existingRow as never);
      vi.mocked(prisma.userMovieEntry.upsert).mockResolvedValue(existingRow as never);

      await repository.upsert(42, 157336, { watched: false });

      expect(prisma.userMovieEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            watched: false,
            rating: 8,
            watchedAt,
          }),
        }),
      );
    });

    it("REQ-5 metadados somem junto quando delete por flags inativos", async () => {
      const existingRow = UserMovieEntryRepositoryFixtures.prismaRow({
        watched: true,
        favorite: false,
        inWatchlist: false,
        rating: 8,
        watchedAt: new Date("2024-06-15T20:00:00.000Z"),
      });

      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(existingRow as never);

      const result = await repository.upsert(42, 157336, { watched: false });

      expect(prisma.userMovieEntry.delete).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("REQ-7 aceita movieId null na gravação", async () => {
      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.userMovieEntry.upsert).mockResolvedValue(
        UserMovieEntryRepositoryFixtures.prismaRow({
          watched: true,
          movieId: null,
        }) as never,
      );

      await repository.upsert(42, 157336, { watched: true, movieId: null });

      expect(prisma.userMovieEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ movieId: null }),
        }),
      );
    });

    it("REQ-7 grava movieId quando informado", async () => {
      vi.mocked(prisma.userMovieEntry.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.userMovieEntry.upsert).mockResolvedValue(
        UserMovieEntryRepositoryFixtures.prismaRow({
          watched: true,
          movieId: 17,
        }) as never,
      );

      await repository.upsert(42, 157336, { watched: true, movieId: 17 });

      expect(prisma.userMovieEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ movieId: 17 }),
        }),
      );
    });

    it("REQ-8 rejeita rating inválido antes de persistir", async () => {
      await expect(
        repository.upsert(42, 157336, { rating: 0 }),
      ).rejects.toThrow(UserMovieEntryValidationException);

      await expect(
        repository.upsert(42, 157336, { rating: 11 }),
      ).rejects.toThrow(UserMovieEntryValidationException);

      expect(prisma.userMovieEntry.findUnique).not.toHaveBeenCalled();
      expect(prisma.userMovieEntry.upsert).not.toHaveBeenCalled();
    });

    it("REQ-8 rejeita tmdbId inválido antes de persistir", async () => {
      await expect(
        repository.upsert(42, 0, { watched: true }),
      ).rejects.toThrow(UserMovieEntryValidationException);

      expect(prisma.userMovieEntry.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("listByUser", () => {
    it("REQ-6 filtra por watched quando presente no filtro", async () => {
      const rowA = UserMovieEntryRepositoryFixtures.prismaRow({
        tmdbId: 1,
        watched: true,
      });
      vi.mocked(prisma.userMovieEntry.findMany).mockResolvedValue([rowA] as never);

      const result = await repository.listByUser(42, { watched: true });

      expect(prisma.userMovieEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 42, watched: true },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.tmdbId).toBe(1);
    });

    it("REQ-6 filtra por favorite quando presente no filtro", async () => {
      const rowB = UserMovieEntryRepositoryFixtures.prismaRow({
        tmdbId: 2,
        favorite: true,
      });
      vi.mocked(prisma.userMovieEntry.findMany).mockResolvedValue([rowB] as never);

      await repository.listByUser(42, { favorite: true });

      expect(prisma.userMovieEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 42, favorite: true },
        orderBy: { updatedAt: "desc" },
      });
    });

    it("REQ-6 filtra por inWatchlist quando presente no filtro", async () => {
      const rowC = UserMovieEntryRepositoryFixtures.prismaRow({
        tmdbId: 3,
        inWatchlist: true,
      });
      vi.mocked(prisma.userMovieEntry.findMany).mockResolvedValue([rowC] as never);

      await repository.listByUser(42, { inWatchlist: true });

      expect(prisma.userMovieEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 42, inWatchlist: true },
        orderBy: { updatedAt: "desc" },
      });
    });

    it("filtro vazio lista apenas por userId", async () => {
      vi.mocked(prisma.userMovieEntry.findMany).mockResolvedValue([]);

      await repository.listByUser(42, {});

      expect(prisma.userMovieEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 42 },
        orderBy: { updatedAt: "desc" },
      });
    });
  });
});
