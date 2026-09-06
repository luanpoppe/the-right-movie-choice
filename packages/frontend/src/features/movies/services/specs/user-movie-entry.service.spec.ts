import { movieClient } from "@/lib/api/movie-client";
import {
  UserMovieEntryListQueryUtils,
  UserMovieEntryService,
} from "../user-movie-entry.service";

jest.mock("@/lib/api/movie-client", () => ({
  movieClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedGet = jest.mocked(movieClient.get);
const mockedPatch = jest.mocked(movieClient.patch);

class UserMovieEntryServiceFixtures {
  static entry(overrides: Record<string, unknown> = {}) {
    return {
      tmdbId: 157336,
      movieId: null,
      watched: true,
      favorite: false,
      inWatchlist: false,
      rating: 9,
      watchedAt: "2026-03-15T03:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      movie: {
        title: "Interestelar",
        year: 2014,
        posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
      },
      ...overrides,
    };
  }
}

describe("UserMovieEntryListQueryUtils", () => {
  it("REQ-3: monta params watched=true", () => {
    expect(UserMovieEntryListQueryUtils.buildParams({ watched: true })).toEqual({
      watched: true,
    });
  });

  it("REQ-4: monta params inWatchlist=true", () => {
    expect(
      UserMovieEntryListQueryUtils.buildParams({ inWatchlist: true }),
    ).toEqual({ inWatchlist: true });
  });

  it("REQ-5: monta params favorite=true", () => {
    expect(
      UserMovieEntryListQueryUtils.buildParams({ favorite: true }),
    ).toEqual({ favorite: true });
  });

  it("edge: filtro vazio retorna undefined", () => {
    expect(UserMovieEntryListQueryUtils.buildParams({})).toBeUndefined();
  });

  it("edge: ignora flags false no query string", () => {
    expect(
      UserMovieEntryListQueryUtils.buildParams({
        watched: false,
        favorite: false,
      }),
    ).toBeUndefined();
  });
});

describe("UserMovieEntryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("REQ-3: listEntries watched chama GET /movie/user-entries?watched=true", async () => {
    const entry = UserMovieEntryServiceFixtures.entry();
    mockedGet.mockResolvedValue({ data: { entries: [entry] } });

    const result = await UserMovieEntryService.listEntries({ watched: true });

    expect(mockedGet).toHaveBeenCalledWith("/movie/user-entries", {
      params: { watched: true },
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.movie?.title).toBe("Interestelar");
  });

  it("REQ-4: listEntries watchlist chama GET com inWatchlist=true", async () => {
    const entry = UserMovieEntryServiceFixtures.entry({
      tmdbId: 550,
      watched: false,
      inWatchlist: true,
      movie: {
        title: "Clube da Luta",
        year: 1999,
        posterPath: "https://image.tmdb.org/t/p/w500/fight.jpg",
      },
    });
    mockedGet.mockResolvedValue({ data: { entries: [entry] } });

    await UserMovieEntryService.listEntries({ inWatchlist: true });

    expect(mockedGet).toHaveBeenCalledWith("/movie/user-entries", {
      params: { inWatchlist: true },
    });
  });

  it("REQ-5: listEntries favorites chama GET com favorite=true", async () => {
    const entry = UserMovieEntryServiceFixtures.entry({
      tmdbId: 27205,
      favorite: true,
      movie: {
        title: "A Origem",
        year: 2010,
        posterPath: "https://image.tmdb.org/t/p/w500/inception.jpg",
      },
    });
    mockedGet.mockResolvedValue({ data: { entries: [entry] } });

    await UserMovieEntryService.listEntries({ favorite: true });

    expect(mockedGet).toHaveBeenCalledWith("/movie/user-entries", {
      params: { favorite: true },
    });
  });

  it("REQ-6: patchEntry envia PATCH com corpo do toggle", async () => {
    const entry = UserMovieEntryServiceFixtures.entry({
      tmdbId: 27205,
      favorite: false,
    });
    mockedPatch.mockResolvedValue({ data: { entry } });

    const result = await UserMovieEntryService.patchEntry(27205, {
      favorite: false,
    });

    expect(mockedPatch).toHaveBeenCalledWith("/movie/user-entries/27205", {
      favorite: false,
    });
    expect(result?.favorite).toBe(false);
  });

  it("REQ-8: listEntries preserva movie null na resposta", async () => {
    const entry = UserMovieEntryServiceFixtures.entry({
      tmdbId: 999001,
      movie: null,
    });
    mockedGet.mockResolvedValue({ data: { entries: [entry] } });

    const result = await UserMovieEntryService.listEntries({ watched: true });

    expect(result[0]?.movie).toBeNull();
    expect(result[0]?.tmdbId).toBe(999001);
  });
});
