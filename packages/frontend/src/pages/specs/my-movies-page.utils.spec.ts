jest.mock("@/utils/env", () => ({
  env: {
    VITE_BACKEND_URL: "http://backend.test",
    VITE_GOOGLE_CLIENT_ID: "test-google-client-id",
    VITE_NODE_ENV: "test",
  },
}));

jest.mock("lucide-react", () => ({
  Bookmark: () => null,
  Eye: () => null,
  Heart: () => null,
  Loader2: () => null,
  X: () => null,
  Film: () => null,
  Star: () => null,
  Calendar: () => null,
}));

jest.mock("@/components/library-movie-card", () => ({
  LibraryMovieCard: () => null,
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

import { MyMoviesPageUtils } from "../MyMoviesPage";

describe("MyMoviesPageUtils", () => {
  it("REQ-3: aba watched usa filtro watched=true", () => {
    expect(MyMoviesPageUtils.getTabFilter("watched")).toEqual({ watched: true });
  });

  it("REQ-4: aba watchlist usa filtro inWatchlist=true", () => {
    expect(MyMoviesPageUtils.getTabFilter("watchlist")).toEqual({
      inWatchlist: true,
    });
  });

  it("REQ-5: aba favorites usa filtro favorite=true", () => {
    expect(MyMoviesPageUtils.getTabFilter("favorites")).toEqual({
      favorite: true,
    });
  });

  it("REQ-3: matchesTab watched exige flag watched", () => {
    expect(
      MyMoviesPageUtils.matchesTab("watched", {
        watched: true,
        favorite: false,
        inWatchlist: false,
        rating: null,
        watchedAt: null,
      }),
    ).toBe(true);

    expect(
      MyMoviesPageUtils.matchesTab("watched", {
        watched: false,
        favorite: true,
        inWatchlist: true,
        rating: null,
        watchedAt: null,
      }),
    ).toBe(false);
  });

  it("edge multi-list: matchesTab independe por aba", () => {
    const multiListFlags = {
      watched: true,
      favorite: true,
      inWatchlist: true,
      rating: 8,
      watchedAt: "2026-01-01T00:00:00.000Z",
    };

    expect(MyMoviesPageUtils.matchesTab("watched", multiListFlags)).toBe(true);
    expect(MyMoviesPageUtils.matchesTab("watchlist", multiListFlags)).toBe(
      true,
    );
    expect(MyMoviesPageUtils.matchesTab("favorites", multiListFlags)).toBe(
      true,
    );
  });

  it("REQ-3: showWatchedDetails só na aba watched", () => {
    expect(MyMoviesPageUtils.showWatchedDetails("watched")).toBe(true);
    expect(MyMoviesPageUtils.showWatchedDetails("watchlist")).toBe(false);
    expect(MyMoviesPageUtils.showWatchedDetails("favorites")).toBe(false);
  });

  it("edge empty state: mensagens específicas por aba", () => {
    expect(MyMoviesPageUtils.getEmptyStateMessage("watched")).toContain(
      "watched",
    );
    expect(MyMoviesPageUtils.getEmptyStateMessage("watchlist")).toContain(
      "Want to watch",
    );
    expect(MyMoviesPageUtils.getEmptyStateMessage("favorites")).toContain(
      "favorited",
    );
  });
});
