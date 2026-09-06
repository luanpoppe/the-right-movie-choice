jest.mock("@/utils/env", () => ({
  env: {
    VITE_BACKEND_URL: "http://backend.test",
    VITE_GOOGLE_CLIENT_ID: "test-google-client-id",
    VITE_NODE_ENV: "test",
  },
}));

jest.mock("@react-oauth/google", () => ({
  GoogleLogin: () => <div data-testid="google-login" />,
}));

jest.mock("lucide-react", () => ({
  Bookmark: () => <span />,
  Eye: () => <span />,
  Heart: () => <span />,
  Loader2: () => <span />,
  X: () => <span />,
  Film: () => <span />,
  Star: () => <span />,
  Calendar: () => <span />,
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/movies/services/user-movie-entry.service", () => ({
  UserMovieEntryService: {
    listEntries: jest.fn(),
    patchEntry: jest.fn(),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserMovieEntryListFilter } from "@/features/movies/dto/user-movie-entry.dto";
import { UserMovieEntryService } from "@/features/movies/services/user-movie-entry.service";
import { LoginRedirectUtils } from "@/features/auth/pages/LoginPage";
import { MyMoviesPage } from "../MyMoviesPage";

const mockedUseAuth = jest.mocked(useAuth);
const mockedListEntries = jest.mocked(UserMovieEntryService.listEntries);
const mockedPatchEntry = jest.mocked(UserMovieEntryService.patchEntry);
const mockedToastError = jest.mocked(toast.error);

class MyMoviesPageFixtures {
  static interstellarEntry() {
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
    };
  }

  static fightClubEntry() {
    return {
      tmdbId: 550,
      movieId: null,
      watched: false,
      favorite: false,
      inWatchlist: true,
      rating: null,
      watchedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      movie: {
        title: "Clube da Luta",
        year: 1999,
        posterPath: "https://image.tmdb.org/t/p/w500/fight.jpg",
      },
    };
  }

  static inceptionEntry() {
    return {
      tmdbId: 27205,
      movieId: null,
      watched: false,
      favorite: true,
      inWatchlist: false,
      rating: null,
      watchedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      movie: {
        title: "A Origem",
        year: 2010,
        posterPath: "https://image.tmdb.org/t/p/w500/inception.jpg",
      },
    };
  }

  static allEntries() {
    return [
      MyMoviesPageFixtures.interstellarEntry(),
      MyMoviesPageFixtures.fightClubEntry(),
      MyMoviesPageFixtures.inceptionEntry(),
    ];
  }
}

function renderMyMoviesPage(initialEntry = "/my-movies") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/my-movies" element={<MyMoviesPage />} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockListEntriesForTab(
  filterMatcher: (filter: UserMovieEntryListFilter) => unknown[],
  hydrationEntries: unknown[] = MyMoviesPageFixtures.allEntries(),
) {
  mockedListEntries.mockImplementation(async (filter = {}) => {
    const hasFilter =
      filter.watched === true ||
      filter.favorite === true ||
      filter.inWatchlist === true;

    if (!hasFilter) {
      return hydrationEntries as never;
    }

    return filterMatcher(filter) as never;
  });
}

describe("LoginRedirectUtils", () => {
  it("REQ-1: preserva redirect relativo /my-movies", () => {
    const params = new URLSearchParams("redirect=/my-movies");

    expect(LoginRedirectUtils.resolveRedirectPath(params)).toBe("/my-movies");
  });

  it("REQ-1: rejeita redirect absoluto externo", () => {
    const params = new URLSearchParams("redirect=//evil.com");

    expect(LoginRedirectUtils.resolveRedirectPath(params)).toBe("/");
  });

  it("REQ-1: sem redirect retorna home", () => {
    const params = new URLSearchParams();

    expect(LoginRedirectUtils.resolveRedirectPath(params)).toBe("/");
  });
});

describe("MyMoviesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListEntries.mockResolvedValue([]);
    mockedPatchEntry.mockResolvedValue(null);
  });

  it("REQ-1: visitante é redirecionado para login com retorno", async () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderMyMoviesPage();

    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  describe("usuário autenticado", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        accessToken: "token",
        setAccessToken: jest.fn(),
        clearSession: jest.fn(),
      });
    });

    it("REQ-2: exibe três abas com Assistidos selecionada", async () => {
      renderMyMoviesPage();

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Watched" })).toHaveAttribute(
          "data-state",
          "active",
        );
      });

      expect(screen.getByRole("tab", { name: "Want to watch" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Favorites" })).toBeInTheDocument();
    });

    it("REQ-3: aba Assistidos chama GET watched=true e exibe card", async () => {
      mockListEntriesForTab((filter) => {
        if (filter.watched === true) {
          return [MyMoviesPageFixtures.interstellarEntry()];
        }
        return [];
      });

      renderMyMoviesPage();

      await waitFor(() => {
        expect(mockedListEntries).toHaveBeenCalledWith({ watched: true });
      });

      expect(screen.getByText("Interestelar")).toBeInTheDocument();
      expect(screen.getByText("2014")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();
      expect(screen.getByText("15/03/2026")).toBeInTheDocument();
    });

    it("REQ-4: aba Quero ver chama GET inWatchlist=true", async () => {
      mockListEntriesForTab((filter) => {
        if (filter.inWatchlist === true) {
          return [MyMoviesPageFixtures.fightClubEntry()];
        }
        return [];
      });

      const user = userEvent.setup();
      renderMyMoviesPage();

      await waitFor(() => {
        expect(mockedListEntries).toHaveBeenCalledWith({ watched: true });
      });

      await user.click(screen.getByRole("tab", { name: "Want to watch" }));

      await waitFor(() => {
        expect(mockedListEntries).toHaveBeenCalledWith({ inWatchlist: true });
      });
      expect(screen.getByText("Clube da Luta")).toBeInTheDocument();
    });

    it("REQ-5: aba Favoritos chama GET favorite=true", async () => {
      mockListEntriesForTab((filter) => {
        if (filter.favorite === true) {
          return [MyMoviesPageFixtures.inceptionEntry()];
        }
        return [];
      });

      const user = userEvent.setup();
      renderMyMoviesPage();

      await waitFor(() => {
        expect(mockedListEntries).toHaveBeenCalledWith({ watched: true });
      });

      await user.click(screen.getByRole("tab", { name: "Favorites" }));

      await waitFor(() => {
        expect(mockedListEntries).toHaveBeenCalledWith({ favorite: true });
      });
      expect(screen.getByText("A Origem")).toBeInTheDocument();
    });

    it("edge empty state: aba vazia exibe CTA para o chat", async () => {
      mockedListEntries.mockResolvedValue([]);

      renderMyMoviesPage();

      await waitFor(() => {
        expect(
          screen.getByText(/haven't marked any movie as watched yet/i),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole("link", { name: "Get recommendations in chat" }),
      ).toHaveAttribute("href", "/");
    });

    it("edge GET failure: exibe toast e botão Tentar novamente", async () => {
      let shouldFailTabFetch = true;

      mockedListEntries.mockImplementation(async (filter) => {
        const isWatchedTabFetch = filter?.watched === true;
        if (isWatchedTabFetch && shouldFailTabFetch) {
          throw new Error("network");
        }
        if (isWatchedTabFetch) {
          return [MyMoviesPageFixtures.interstellarEntry()];
        }
        return [];
      });

      const user = userEvent.setup();
      renderMyMoviesPage();

      await waitFor(() => {
        expect(mockedToastError).toHaveBeenCalledWith(
          "Unexpected Error. Try again or get in contact with the staff.",
        );
      });

      expect(
        screen.getByText("Could not load your movies."),
      ).toBeInTheDocument();

      shouldFailTabFetch = false;
      const callsBeforeRetry = mockedListEntries.mock.calls.length;

      await user.click(screen.getByRole("button", { name: "Try again" }));

      await waitFor(() => {
        expect(mockedListEntries.mock.calls.length).toBeGreaterThan(
          callsBeforeRetry,
        );
      });

      expect(
        screen.queryByText("Could not load your movies."),
      ).not.toBeInTheDocument();
    });

    it("REQ-6: desmarcar favorito remove card da aba sem recarregar", async () => {
      const favoriteEntry = MyMoviesPageFixtures.inceptionEntry();

      mockListEntriesForTab((filter) => {
        if (filter.favorite === true) {
          return [favoriteEntry];
        }
        return [];
      }, [favoriteEntry]);

      mockedPatchEntry.mockImplementation(async (_tmdbId, patch) => {
        if (patch.favorite === false) {
          return {
            ...favoriteEntry,
            favorite: false,
          };
        }
        return favoriteEntry;
      });

      const user = userEvent.setup();
      renderMyMoviesPage();

      await user.click(screen.getByRole("tab", { name: "Favorites" }));

      await waitFor(() => {
        expect(screen.getByText("A Origem")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Favorite" }));

      await waitFor(() => {
        expect(mockedPatchEntry).toHaveBeenCalledWith(27205, {
          favorite: false,
        });
      });

      await waitFor(() => {
        expect(screen.queryByText("A Origem")).not.toBeInTheDocument();
      });
    });

    it("edge multi-list: filme em várias listas aparece em cada aba", async () => {
      const multiListEntry = {
        ...MyMoviesPageFixtures.interstellarEntry(),
        favorite: true,
        inWatchlist: true,
      };

      mockListEntriesForTab((filter) => {
        if (filter.watched === true) {
          return [multiListEntry];
        }
        if (filter.inWatchlist === true) {
          return [multiListEntry];
        }
        if (filter.favorite === true) {
          return [multiListEntry];
        }
        return [];
      }, [multiListEntry]);

      const user = userEvent.setup();
      renderMyMoviesPage();

      await waitFor(() => {
        expect(screen.getByText("Interestelar")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("tab", { name: "Want to watch" }));
      await waitFor(() => {
        expect(screen.getByText("Interestelar")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("tab", { name: "Favorites" }));
      await waitFor(() => {
        expect(screen.getByText("Interestelar")).toBeInTheDocument();
      });
    });
  });
});
