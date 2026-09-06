import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import type { UserMovieEntryEntity } from "@/features/movies/entities/user-movie-entry.entity";
import { LibraryMovieCard } from "../library-movie-card";

jest.mock("lucide-react", () => ({
  Bookmark: () => <span data-testid="icon-bookmark" />,
  Eye: () => <span data-testid="icon-eye" />,
  Heart: () => <span data-testid="icon-heart" />,
  Loader2: () => <span data-testid="icon-loader" />,
  X: () => <span data-testid="icon-x" />,
  Film: () => <span data-testid="icon-film" />,
  Star: () => <span data-testid="icon-star" />,
  Calendar: () => <span data-testid="icon-calendar" />,
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/movies/context/use-user-movie-entries.hook", () => ({
  useUserMovieEntries: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseUserMovieEntries = jest.mocked(useUserMovieEntries);

class LibraryMovieCardFixtures {
  static entry(
    overrides: Partial<UserMovieEntryEntity> = {},
  ): UserMovieEntryEntity {
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

function renderCard(
  entry: UserMovieEntryEntity,
  showWatchedDetails = false,
) {
  return render(
    <MemoryRouter>
      <LibraryMovieCard entry={entry} showWatchedDetails={showWatchedDetails} />
    </MemoryRouter>,
  );
}

describe("LibraryMovieCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });
    mockedUseUserMovieEntries.mockReturnValue({
      getFlags: jest.fn().mockReturnValue({
        watched: true,
        favorite: false,
        inWatchlist: false,
        rating: 9,
        watchedAt: "2026-03-15T03:00:00.000Z",
      }),
      patchEntry: jest.fn(),
      isLoading: false,
      isPatching: () => false,
    });
  });

  it("REQ-3: exibe título, ano, nota e data assistida na aba assistidos", () => {
    const entry = LibraryMovieCardFixtures.entry();

    renderCard(entry, true);

    expect(screen.getByText("Interestelar")).toBeInTheDocument();
    expect(screen.getByText("2014")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("15/03/2026")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Poster de Interestelar" })).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w500/poster.jpg",
    );
  });

  it("REQ-10: sem catálogo exibe Filme #tmdbId e placeholder", () => {
    const entry = LibraryMovieCardFixtures.entry({
      tmdbId: 999001,
      movie: null,
      rating: null,
      watchedAt: null,
    });

    renderCard(entry, true);

    expect(screen.getByText("Filme #999001")).toBeInTheDocument();
    expect(screen.getByTestId("icon-film")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("REQ-4: exibe metadados de catálogo na watchlist sem detalhes assistidos", () => {
    const entry = LibraryMovieCardFixtures.entry({
      tmdbId: 550,
      watched: false,
      inWatchlist: true,
      rating: null,
      watchedAt: null,
      movie: {
        title: "Clube da Luta",
        year: 1999,
        posterPath: "https://image.tmdb.org/t/p/w500/fight.jpg",
      },
    });

    renderCard(entry, false);

    expect(screen.getByText("Clube da Luta")).toBeInTheDocument();
    expect(screen.getByText("1999")).toBeInTheDocument();
    expect(screen.queryByText("9")).not.toBeInTheDocument();
  });

  it("REQ-5: exibe metadados de catálogo nos favoritos", () => {
    const entry = LibraryMovieCardFixtures.entry({
      tmdbId: 27205,
      favorite: true,
      watched: false,
      movie: {
        title: "A Origem",
        year: 2010,
        posterPath: "https://image.tmdb.org/t/p/w500/inception.jpg",
      },
    });

    renderCard(entry, false);

    expect(screen.getByText("A Origem")).toBeInTheDocument();
    expect(screen.getByText("2010")).toBeInTheDocument();
  });

  it("REQ-6: card inclui toggles de lista para o tmdbId", () => {
    const entry = LibraryMovieCardFixtures.entry({ tmdbId: 27205, favorite: true });

    renderCard(entry, false);

    expect(screen.getByRole("button", { name: "Favorito" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watchlist" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assistido" })).toBeInTheDocument();
  });
});
