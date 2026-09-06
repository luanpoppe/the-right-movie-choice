import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import type { UserMovieEntryEntity } from "@/domains/movies/domain/entities/user-movie-entry.entity";
import { UserMovieEntryValidationException } from "@/domains/movies/domain/exceptions/user-movie-entry-validation.exception";
import { GetUserMovieEntryUseCase } from "@/domains/movies/application/use-cases/get-user-movie-entry.use-case";
import { ListUserMovieEntriesUseCase } from "@/domains/movies/application/use-cases/list-user-movie-entries.use-case";
import { UpsertUserMovieEntryUseCase } from "@/domains/movies/application/use-cases/upsert-user-movie-entry.use-case";
import type {
  UserMovieEntryListQueryDTO,
  UserMovieEntryPatchDTO,
  UserMovieEntryTmdbIdParams,
} from "../../dto/user-movie-entry.dto";
import { UserMovieEntryController } from "../user-movie-entry.controller";

class UserMovieEntryControllerFixtures {
  static entry(overrides: Partial<UserMovieEntryEntity> = {}): UserMovieEntryEntity {
    return {
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

function createReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

function createAuthRequest<T extends Record<string, unknown>>(
  request: T,
): T & { userMovieEntryAuth: { userId: number } } {
  return {
    ...request,
    userMovieEntryAuth: { userId: 42 },
  };
}

describe("UserMovieEntryController", () => {
  let listUserMovieEntriesUseCase: ListUserMovieEntriesUseCase;
  let getUserMovieEntryUseCase: GetUserMovieEntryUseCase;
  let upsertUserMovieEntryUseCase: UpsertUserMovieEntryUseCase;
  let handlers: ReturnType<typeof UserMovieEntryController.create>;

  beforeEach(() => {
    vi.clearAllMocks();

    listUserMovieEntriesUseCase = {
      execute: vi.fn(),
    } as unknown as ListUserMovieEntriesUseCase;
    getUserMovieEntryUseCase = {
      execute: vi.fn(),
    } as unknown as GetUserMovieEntryUseCase;
    upsertUserMovieEntryUseCase = {
      execute: vi.fn(),
    } as unknown as UpsertUserMovieEntryUseCase;

    handlers = UserMovieEntryController.create({
      listUserMovieEntriesUseCase,
      getUserMovieEntryUseCase,
      upsertUserMovieEntryUseCase,
    });
  });

  it("list happy path uses userId from auth context", async () => {
    const entry = UserMovieEntryControllerFixtures.entry();
    vi.mocked(listUserMovieEntriesUseCase.execute).mockResolvedValue([entry]);
    const request = createAuthRequest({
      query: { watched: "true" },
    }) as FastifyRequest<{ Querystring: UserMovieEntryListQueryDTO }>;
    const reply = createReply();

    await handlers.list(request, reply);

    expect(listUserMovieEntriesUseCase.execute).toHaveBeenCalledWith(42, {
      watched: true,
    });
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      entries: [
        {
          tmdbId: 157336,
          movieId: 17,
          watched: true,
          favorite: false,
          inWatchlist: true,
          rating: 9,
          watchedAt: "2024-06-15T20:00:00.000Z",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
  });

  it("list accepts query booleans already coerced by Fastify validator", async () => {
    const entry = UserMovieEntryControllerFixtures.entry();
    vi.mocked(listUserMovieEntriesUseCase.execute).mockResolvedValue([entry]);
    const request = createAuthRequest({
      query: { watched: true },
    }) as FastifyRequest<{ Querystring: UserMovieEntryListQueryDTO }>;
    const reply = createReply();

    await handlers.list(request, reply);

    expect(listUserMovieEntriesUseCase.execute).toHaveBeenCalledWith(42, {
      watched: true,
    });
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      entries: [
        {
          tmdbId: 157336,
          movieId: 17,
          watched: true,
          favorite: false,
          inWatchlist: true,
          rating: 9,
          watchedAt: "2024-06-15T20:00:00.000Z",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
  });

  it("get returns 200 with entry when found", async () => {
    const entry = UserMovieEntryControllerFixtures.entry();
    vi.mocked(getUserMovieEntryUseCase.execute).mockResolvedValue(entry);
    const request = createAuthRequest({
      params: { tmdbId: "157336" },
    }) as FastifyRequest<{ Params: UserMovieEntryTmdbIdParams }>;
    const reply = createReply();

    await handlers.getByTmdbId(request, reply);

    expect(getUserMovieEntryUseCase.execute).toHaveBeenCalledWith(42, 157336);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      entry: {
        tmdbId: 157336,
        movieId: 17,
        watched: true,
        favorite: false,
        inWatchlist: true,
        rating: 9,
        watchedAt: "2024-06-15T20:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });
  });

  it("get returns 404 when entry is absent", async () => {
    vi.mocked(getUserMovieEntryUseCase.execute).mockResolvedValue(null);
    const request = createAuthRequest({
      params: { tmdbId: "157336" },
    }) as FastifyRequest<{ Params: UserMovieEntryTmdbIdParams }>;
    const reply = createReply();

    await handlers.getByTmdbId(request, reply);

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({
      error: "User movie entry not found",
    });
  });

  it("patch returns 200 with entry when upsert succeeds", async () => {
    const entry = UserMovieEntryControllerFixtures.entry({ favorite: true });
    vi.mocked(upsertUserMovieEntryUseCase.execute).mockResolvedValue(entry);
    const request = createAuthRequest({
      params: { tmdbId: "157336" },
      body: { favorite: true },
    }) as FastifyRequest<{
      Params: UserMovieEntryTmdbIdParams;
      Body: UserMovieEntryPatchDTO;
    }>;
    const reply = createReply();

    await handlers.patch(request, reply);

    expect(upsertUserMovieEntryUseCase.execute).toHaveBeenCalledWith(
      42,
      157336,
      { favorite: true },
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      entry: {
        tmdbId: 157336,
        movieId: 17,
        watched: true,
        favorite: true,
        inWatchlist: true,
        rating: 9,
        watchedAt: "2024-06-15T20:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });
  });

  it("patch returns 200 with entry null when all flags are cleared", async () => {
    vi.mocked(upsertUserMovieEntryUseCase.execute).mockResolvedValue(null);
    const request = createAuthRequest({
      params: { tmdbId: "157336" },
      body: { watched: false, favorite: false, inWatchlist: false },
    }) as FastifyRequest<{
      Params: UserMovieEntryTmdbIdParams;
      Body: UserMovieEntryPatchDTO;
    }>;
    const reply = createReply();

    await handlers.patch(request, reply);

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ entry: null });
  });

  it("rejects invalid tmdbId in path before calling use case", async () => {
    const request = createAuthRequest({
      params: { tmdbId: "0" },
      body: { watched: true },
    }) as FastifyRequest<{
      Params: UserMovieEntryTmdbIdParams;
      Body: UserMovieEntryPatchDTO;
    }>;
    const reply = createReply();

    await expect(handlers.patch(request, reply)).rejects.toBeInstanceOf(
      UserMovieEntryValidationException,
    );
    expect(upsertUserMovieEntryUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects invalid rating before calling use case", async () => {
    const request = createAuthRequest({
      params: { tmdbId: "157336" },
      body: { rating: 11 },
    }) as FastifyRequest<{
      Params: UserMovieEntryTmdbIdParams;
      Body: UserMovieEntryPatchDTO;
    }>;
    const reply = createReply();

    await expect(handlers.patch(request, reply)).rejects.toBeInstanceOf(
      UserMovieEntryValidationException,
    );
    expect(upsertUserMovieEntryUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects empty patch body before calling use case", async () => {
    const request = createAuthRequest({
      params: { tmdbId: "157336" },
      body: {},
    }) as FastifyRequest<{
      Params: UserMovieEntryTmdbIdParams;
      Body: UserMovieEntryPatchDTO;
    }>;
    const reply = createReply();

    await expect(handlers.patch(request, reply)).rejects.toBeInstanceOf(
      UserMovieEntryValidationException,
    );
    expect(upsertUserMovieEntryUseCase.execute).not.toHaveBeenCalled();
  });

  it("uses userId from auth context instead of any client input", async () => {
    const entry = UserMovieEntryControllerFixtures.entry();
    vi.mocked(upsertUserMovieEntryUseCase.execute).mockResolvedValue(entry);
    const request = createAuthRequest({
      params: { tmdbId: "157336" },
      body: { watched: true },
    }) as FastifyRequest<{
      Params: UserMovieEntryTmdbIdParams;
      Body: UserMovieEntryPatchDTO;
    }>;
    const reply = createReply();

    await handlers.patch(request, reply);

    const [calledUserId] = vi.mocked(upsertUserMovieEntryUseCase.execute).mock
      .calls[0]!;

    expect(calledUserId).toBe(42);
    expect(upsertUserMovieEntryUseCase.execute).toHaveBeenCalledWith(
      42,
      157336,
      { watched: true },
    );
  });
});
