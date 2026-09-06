import { describe, expect, it } from "vitest";
import { UserMovieEntryPrismaMapper } from "../user-movie-entry-prisma.mapper";

class UserMovieEntryPrismaMapperFixtures {
  static prismaRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      userId: 42,
      tmdbId: 157336,
      movieId: 17,
      watched: true,
      favorite: false,
      inWatchlist: true,
      rating: 9,
      watchedAt: new Date("2024-06-15T20:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }
}

describe("UserMovieEntryPrismaMapper", () => {
  it("mapeia todos os campos da row Prisma para a entidade de domínio", () => {
    const row = UserMovieEntryPrismaMapperFixtures.prismaRow();

    const entity = UserMovieEntryPrismaMapper.toEntity(row as never);

    expect(entity).toEqual({
      userId: 42,
      tmdbId: 157336,
      movieId: 17,
      watched: true,
      favorite: false,
      inWatchlist: true,
      rating: 9,
      watchedAt: new Date("2024-06-15T20:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
  });

  it("preserva null em movieId, rating e watchedAt", () => {
    const row = UserMovieEntryPrismaMapperFixtures.prismaRow({
      movieId: null,
      rating: null,
      watchedAt: null,
    });

    const entity = UserMovieEntryPrismaMapper.toEntity(row as never);

    expect(entity.movieId).toBeNull();
    expect(entity.rating).toBeNull();
    expect(entity.watchedAt).toBeNull();
  });

  it("não expõe id interno da row Prisma na entidade", () => {
    const row = UserMovieEntryPrismaMapperFixtures.prismaRow({ id: 999 });

    const entity = UserMovieEntryPrismaMapper.toEntity(row as never);

    expect(entity).not.toHaveProperty("id");
  });
});
