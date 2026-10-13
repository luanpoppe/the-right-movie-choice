jest.mock("@/components/search-movie-card", () => ({
  SearchMovieCard: ({ hit }: { hit: { title: string } }) => (
    <div data-testid="search-movie-card">{hit.title}</div>
  ),
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <span data-testid="icon-loader" />,
}));

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MovieSearchHit } from "../../dto/movie-catalog-search.dto";
import { CatalogSearchResults } from "../catalog-search-results";

function hit(overrides: Partial<MovieSearchHit> = {}): MovieSearchHit {
  return {
    id: 157336,
    title: "Interstellar",
    year: 2014,
    posterPath: null,
    overview: "A team travels through a wormhole.",
    ...overrides,
  };
}

function renderResults(
  overrides: Partial<React.ComponentProps<typeof CatalogSearchResults>> = {},
) {
  const onLoadMore = overrides.onLoadMore ?? jest.fn();
  const onRetry = overrides.onRetry ?? jest.fn();

  render(
    <CatalogSearchResults
      results={overrides.results ?? []}
      loading={overrides.loading ?? false}
      error={overrides.error ?? null}
      hasMore={overrides.hasMore ?? false}
      onLoadMore={onLoadMore}
      onRetry={onRetry}
      emptyMessage={overrides.emptyMessage}
    />,
  );

  return { onLoadMore, onRetry };
}

describe("CatalogSearchResults", () => {
  it("REQ-9: loading inicial mostra status de busca", () => {
    renderResults({ loading: true });

    expect(screen.getByRole("status")).toHaveTextContent("Searching movies...");
    expect(screen.queryByTestId("search-movie-card")).not.toBeInTheDocument();
  });

  it("REQ-9: erro sem resultados mostra mensagem e Tentar novamente", () => {
    renderResults({ error: new Error("catalog down") });

    expect(
      screen.getByText("Could not load results. The catalog may be unavailable."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("search-movie-card")).not.toBeInTheDocument();
  });

  it("REQ-9: clicar em Try again chama onRetry", async () => {
    const user = userEvent.setup();
    const { onRetry } = renderResults({ error: new Error("catalog down") });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("edge: sem resultados mostra mensagem padrão", () => {
    renderResults({ results: [] });

    expect(
      screen.getByText("No movies found. Try another search."),
    ).toBeInTheDocument();
  });

  it("edge: emptyMessage customizada é exibida", () => {
    renderResults({ results: [], emptyMessage: "Nada por aqui." });

    expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
  });

  it("REQ-2: renderiza um card por resultado", () => {
    renderResults({
      results: [
        hit({ id: 1, title: "First" }),
        hit({ id: 2, title: "Second" }),
      ],
    });

    expect(screen.getAllByTestId("search-movie-card")).toHaveLength(2);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("REQ-9 edge: erro com resultados existentes mantém a lista e mostra banner inline", () => {
    renderResults({
      results: [hit()],
      error: new Error("next page failed"),
      hasMore: true,
    });

    expect(screen.getByTestId("search-movie-card")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load more results. The catalog may be unavailable.",
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("REQ-9 edge: clicar em Try again do banner inline chama onRetry", async () => {
    const user = userEvent.setup();
    const { onRetry } = renderResults({
      results: [hit()],
      error: new Error("next page failed"),
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("REQ-5: mostra Carregar mais quando hasMore e chama onLoadMore", async () => {
    const user = userEvent.setup();
    const { onLoadMore } = renderResults({
      results: [hit()],
      hasMore: true,
    });

    await user.click(screen.getByRole("button", { name: /load more/i }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("REQ-5 edge: botão Carregar mais fica desabilitado durante loading", () => {
    renderResults({ results: [hit()], hasMore: true, loading: true });

    expect(screen.getByRole("button", { name: /load more/i })).toBeDisabled();
  });

  it("edge: sem hasMore não mostra Carregar mais", () => {
    renderResults({ results: [hit()], hasMore: false });

    expect(
      screen.queryByRole("button", { name: /load more/i }),
    ).not.toBeInTheDocument();
  });
});

describe("CatalogSearchResults infinite scroll", () => {
  let lastCallback: IntersectionObserverCallback | null = null;
  let observedElement: Element | null = null;

  class FakeIntersectionObserver {
    root = null;
    rootMargin = "";
    thresholds = [];
    constructor(callback: IntersectionObserverCallback) {
      lastCallback = callback;
    }
    observe(element: Element) {
      observedElement = element;
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  beforeEach(() => {
    lastCallback = null;
    observedElement = null;
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      FakeIntersectionObserver;
  });

  afterEach(() => {
    delete (globalThis as unknown as { IntersectionObserver?: unknown })
      .IntersectionObserver;
  });

  it("carrega a próxima página quando o sentinela entra na viewport", () => {
    const { onLoadMore } = renderResults({ results: [hit()], hasMore: true });

    expect(observedElement).not.toBeNull();

    act(() => {
      lastCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("não carrega quando o sentinela está fora da viewport", () => {
    const { onLoadMore } = renderResults({ results: [hit()], hasMore: true });

    act(() => {
      lastCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("não observa o sentinela durante loading", () => {
    renderResults({ results: [hit()], hasMore: true, loading: true });

    expect(observedElement).toBeNull();
  });
});
