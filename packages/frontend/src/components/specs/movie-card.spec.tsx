import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import type { SingleMovieReccomendationEntity } from "@/features/movies/entities/movie-recommendation.entity";
import { MovieCard } from "../movie-card";

jest.mock("lucide-react", () => ({
  Star: () => <span data-testid="icon-star" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Clock: () => <span data-testid="icon-clock" />,
  Bookmark: () => <span data-testid="icon-bookmark" />,
  Eye: () => <span data-testid="icon-eye" />,
  Heart: () => <span data-testid="icon-heart" />,
  X: () => <span data-testid="icon-x" />,
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/movies/context/use-user-movie-entries.hook", () => ({
  useUserMovieEntries: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseUserMovieEntries = jest.mocked(useUserMovieEntries);

class MovieCardFixtures {
  static movie(
    overrides: Partial<SingleMovieReccomendationEntity> = {},
  ): SingleMovieReccomendationEntity {
    return {
      title: "Inception",
      director: "Christopher Nolan",
      actors: ["Leonardo DiCaprio"],
      releaseYear: 2010,
      streamingPlatform: "Netflix",
      imdbRating: 8.8,
      synopsis: "A thief who steals corporate secrets through dream-sharing.",
      whySuggestion: "Mind-bending sci-fi thriller.",
      durationInMinutes: 148,
      ...overrides,
    };
  }
}

function renderCard(movie: SingleMovieReccomendationEntity) {
  return render(
    <MemoryRouter>
      <MovieCard movie={movie} />
    </MemoryRouter>,
  );
}

describe("MovieCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });
    mockedUseUserMovieEntries.mockReturnValue({
      getFlags: jest.fn().mockReturnValue({
        watched: false,
        favorite: false,
        inWatchlist: false,
        rating: null,
        watchedAt: null,
      }),
      hasEntry: jest.fn().mockReturnValue(false),
      patchEntry: jest.fn(),
      isLoading: false,
      isPatching: () => false,
    });
  });

  it("REQ-8: card sem tmdbId não exibe barra de toggles de lista", () => {
    const movie = MovieCardFixtures.movie();
    renderCard(movie);

    expect(screen.queryByRole("button", { name: "Favorite" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Watchlist" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Watched" })).not.toBeInTheDocument();
  });

  it("exibe ações de lista quando tmdbId está presente", () => {
    const movie = MovieCardFixtures.movie({ tmdbId: 27205 });
    renderCard(movie);

    expect(screen.getByRole("button", { name: "Favorite" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watchlist" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watched" })).toBeInTheDocument();
  });
});
