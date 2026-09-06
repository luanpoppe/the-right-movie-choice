import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpsertUserMovieEntryUseCase } from "../upsert-user-movie-entry.use-case";
import type {
  UserMovieEntryEntity,
  UserMovieEntryPatch,
} from "../../../domain/entities/user-movie-entry.entity";
import { UserMovieEntryValidationException } from "../../../domain/exceptions/user-movie-entry-validation.exception";
import { IUserMovieEntryRepository } from "../../../domain/repositories/user-movie-entry.repository";

describe("UpsertUserMovieEntryUseCase", () => {
  const mockEntry: UserMovieEntryEntity = {
    userId: 42,
    tmdbId: 157336,
    movieId: null,
    watched: true,
    favorite: false,
    inWatchlist: false,
    rating: 9,
    watchedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  let userMovieEntryRepository: IUserMovieEntryRepository;
  let useCase: UpsertUserMovieEntryUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    userMovieEntryRepository = {
      findByUserAndTmdbId: vi.fn(),
      upsert: vi.fn().mockResolvedValue(mockEntry),
      listByUser: vi.fn(),
    };

    useCase = new UpsertUserMovieEntryUseCase(userMovieEntryRepository);
  });

  it("should reject empty patch before calling repository", async () => {
    await expect(useCase.execute(42, 157336, {})).rejects.toBeInstanceOf(
      UserMovieEntryValidationException,
    );

    expect(userMovieEntryRepository.upsert).not.toHaveBeenCalled();
  });

  it("should reject patch with only undefined values before calling repository", async () => {
    const patchWithOnlyUndefined = {
      watched: undefined,
    } as unknown as UserMovieEntryPatch;

    await expect(
      useCase.execute(42, 157336, patchWithOnlyUndefined),
    ).rejects.toBeInstanceOf(UserMovieEntryValidationException);

    expect(userMovieEntryRepository.upsert).not.toHaveBeenCalled();
  });

  it("should reject invalid tmdbId before calling repository", async () => {
    await expect(
      useCase.execute(42, 0, { watched: true }),
    ).rejects.toBeInstanceOf(UserMovieEntryValidationException);

    expect(userMovieEntryRepository.upsert).not.toHaveBeenCalled();
  });

  it("should reject invalid rating before calling repository", async () => {
    await expect(
      useCase.execute(42, 157336, { rating: 11 }),
    ).rejects.toBeInstanceOf(UserMovieEntryValidationException);

    expect(userMovieEntryRepository.upsert).not.toHaveBeenCalled();
  });

  it("should delegate valid patch to repository and return entry", async () => {
    const patch = { watched: true, rating: 9 };

    const result = await useCase.execute(42, 157336, patch);

    expect(userMovieEntryRepository.upsert).toHaveBeenCalledWith(
      42,
      157336,
      patch,
    );
    expect(result).toEqual(mockEntry);
  });

  it("should return null when repository removes entry with no active flags", async () => {
    vi.mocked(userMovieEntryRepository.upsert).mockResolvedValue(null);

    const result = await useCase.execute(42, 157336, {
      watched: false,
      favorite: false,
      inWatchlist: false,
    });

    expect(result).toBeNull();
  });
});
