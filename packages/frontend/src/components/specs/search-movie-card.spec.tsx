jest.mock("lucide-react", () => ({
  Calendar: () => <span data-testid="icon-calendar" />,
  Film: () => <span data-testid="icon-film" />,
  Star: () => <span data-testid="icon-star" />,
}));

jest.mock("@/components/movie-card-list-actions", () => ({
  MovieCardListActions: ({ tmdbId }: { tmdbId: number }) => (
    <div data-testid="list-actions">{tmdbId}</div>
  ),
}));

import { fireEvent, render, screen } from "@testing-library/react";
import type { MovieSearchHit } from "@/features/movies/dto/movie-catalog-search.dto";
import { SearchMovieCard } from "../search-movie-card";

function hit(overrides: Partial<MovieSearchHit> = {}): MovieSearchHit {
  return {
    id: 157336,
    title: "Interstellar",
    year: 2014,
    posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
    overview: "A team travels through a wormhole.",
    ...overrides,
  };
}

describe("SearchMovieCard", () => {
  it("REQ-2: exibe título, ano e sinopse", () => {
    render(<SearchMovieCard hit={hit()} />);

    expect(screen.getByText("Interstellar")).toBeInTheDocument();
    expect(screen.getByText("2014")).toBeInTheDocument();
    expect(
      screen.getByText("A team travels through a wormhole."),
    ).toBeInTheDocument();
  });

  it("edge: ano ausente mostra placeholder", () => {
    render(<SearchMovieCard hit={hit({ year: null })} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("edge: pôster ausente mostra placeholder", () => {
    render(<SearchMovieCard hit={hit({ posterPath: null })} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("icon-film")).toBeInTheDocument();
  });

  it("exibe imagem quando posterPath é URL absoluta", () => {
    render(<SearchMovieCard hit={hit()} />);

    expect(
      screen.getByRole("img", { name: "Poster for Interstellar" }),
    ).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w500/poster.jpg",
    );
  });

  it("edge: erro ao carregar imagem cai para o placeholder", () => {
    render(<SearchMovieCard hit={hit()} />);

    fireEvent.error(
      screen.getByRole("img", { name: "Poster for Interstellar" }),
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("icon-film")).toBeInTheDocument();
  });

  it("edge: posterPath relativo não vira imagem", () => {
    render(<SearchMovieCard hit={hit({ posterPath: "/poster.jpg" })} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("REQ-7: repassa o tmdbId para as ações de lista", () => {
    render(<SearchMovieCard hit={hit({ id: 27205 })} />);

    expect(screen.getByTestId("list-actions")).toHaveTextContent("27205");
  });
});
