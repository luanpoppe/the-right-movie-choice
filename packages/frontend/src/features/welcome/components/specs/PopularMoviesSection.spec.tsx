import { render, screen } from "@testing-library/react";
import { PopularMovie } from "@/features/movies/dto/popular-movies.dto";
import { PopularMoviesSection } from "../PopularMoviesSection";

jest.mock("lucide-react", () => ({
  Film: () => <span data-testid="icon-film" />,
  Star: () => <span data-testid="icon-star" />,
}));

jest.mock("@/components/movie-card-list-actions", () => ({
  MovieCardListActions: () => <div data-testid="list-actions" />,
}));

class PopularMovieFixtures {
  static movie(overrides: Partial<PopularMovie> = {}): PopularMovie {
    return {
      tmdbId: 27205,
      title: "Inception",
      year: 2010,
      posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
      overview: "A thief who steals secrets through dream-sharing.",
      runtimeMinutes: 148,
      voteAverage: 8.8,
      directors: ["Christopher Nolan"],
      ...overrides,
    };
  }
}

describe("PopularMoviesSection", () => {
  it("não renderiza nada enquanto carrega", () => {
    const { container } = render(
      <PopularMoviesSection movies={[]} isLoading={true} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("não renderiza nada quando não há filmes", () => {
    const { container } = render(
      <PopularMoviesSection movies={[]} isLoading={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza um card por filme popular", () => {
    const movies = [
      PopularMovieFixtures.movie({ tmdbId: 1, title: "Inception" }),
      PopularMovieFixtures.movie({ tmdbId: 2, title: "Parasite" }),
      PopularMovieFixtures.movie({ tmdbId: 3, title: "Drive" }),
    ];

    render(<PopularMoviesSection movies={movies} isLoading={false} />);

    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.getByText("Parasite")).toBeInTheDocument();
    expect(screen.getByText("Drive")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Poster for Inception" }),
    ).toBeInTheDocument();
  });
});
