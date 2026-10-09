jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/movies/hooks/use-catalog-search", () => ({
  useCatalogSearch: jest.fn(),
}));

jest.mock("@/features/movies/context/user-movie-entries.context", () => ({
  UserMovieEntriesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="entries-provider">{children}</div>
  ),
}));

jest.mock("@/features/movies/components/catalog-search-bar", () => ({
  CatalogSearchBar: ({
    language,
    value,
  }: {
    language: string;
    value: string;
  }) => (
    <div data-testid="search-bar" data-language={language} data-value={value} />
  ),
}));

jest.mock("@/features/movies/components/catalog-search-filters-panel", () => ({
  CatalogSearchFiltersPanel: () => <div data-testid="filters-panel" />,
}));

jest.mock("@/features/movies/components/catalog-search-results", () => ({
  CatalogSearchResults: ({
    loading,
    error,
    results,
  }: {
    loading: boolean;
    error: Error | null;
    results: unknown[];
  }) => (
    <div
      data-testid="results"
      data-loading={String(loading)}
      data-error={error ? "yes" : "no"}
      data-count={results.length}
    />
  ),
}));

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useCatalogSearch } from "@/features/movies/hooks/use-catalog-search";
import type { CatalogSearchFiltersValidationError } from "@/features/movies/utils/catalog-search-filters-validation.utils";
import { SearchPage } from "../SearchPage";

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseCatalogSearch = jest.mocked(useCatalogSearch);

function catalogSearchResult(
  overrides: Partial<ReturnType<typeof useCatalogSearch>> = {},
): ReturnType<typeof useCatalogSearch> {
  return {
    results: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: false,
    filters: {},
    errors: [],
    search: jest.fn(),
    applyFilters: jest.fn(),
    loadMore: jest.fn(),
    setLanguage: jest.fn(),
    retry: jest.fn(),
    ...overrides,
  };
}

function renderSearchPage() {
  return render(
    <MemoryRouter initialEntries={["/search"]}>
      <SearchPage />
    </MemoryRouter>,
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCatalogSearch.mockReturnValue(catalogSearchResult());
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });
  });

  it("REQ-1: sem idioma na URL usa en-US por padrão", () => {
    renderSearchPage();

    expect(screen.getByTestId("search-bar")).toHaveAttribute(
      "data-language",
      "en-US",
    );
  });

  it("REQ-6: idioma da URL é repassado à barra", () => {
    mockedUseCatalogSearch.mockReturnValue(
      catalogSearchResult({ filters: { language: "pt-BR" } }),
    );

    renderSearchPage();

    expect(screen.getByTestId("search-bar")).toHaveAttribute(
      "data-language",
      "pt-BR",
    );
  });

  it("REQ-2: query da URL é repassada à barra", () => {
    mockedUseCatalogSearch.mockReturnValue(
      catalogSearchResult({ filters: { query: "Interstellar" } }),
    );

    renderSearchPage();

    expect(screen.getByTestId("search-bar")).toHaveAttribute(
      "data-value",
      "Interstellar",
    );
  });

  it("REQ-9 edge: erros de validação aparecem em alerta", () => {
    const errors: CatalogSearchFiltersValidationError[] = [
      { field: "minRating", message: "A nota mínima deve ficar entre 0 e 10." },
      { field: "page", message: "A página deve ser no mínimo 1." },
    ];
    mockedUseCatalogSearch.mockReturnValue(catalogSearchResult({ errors }));

    renderSearchPage();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("A nota mínima deve ficar entre 0 e 10.");
    expect(alert).toHaveTextContent("A página deve ser no mínimo 1.");
  });

  it("edge: sem erros de validação não renderiza alerta", () => {
    renderSearchPage();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("REQ-8: visitante não usa o provider de listas", () => {
    renderSearchPage();

    expect(screen.queryByTestId("entries-provider")).not.toBeInTheDocument();
  });

  it("REQ-7: logado usa o provider de listas", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderSearchPage();

    expect(screen.getByTestId("entries-provider")).toBeInTheDocument();
  });

  it("edge: repassa resultados, loading e erro para a lista", () => {
    mockedUseCatalogSearch.mockReturnValue(
      catalogSearchResult({
        results: [
          {
            id: 1,
            title: "Interstellar",
            year: 2014,
            posterPath: null,
            overview: "x",
          },
        ],
        loading: true,
        error: new Error("catalog down"),
      }),
    );

    renderSearchPage();

    const results = screen.getByTestId("results");
    expect(results).toHaveAttribute("data-loading", "true");
    expect(results).toHaveAttribute("data-error", "yes");
    expect(results).toHaveAttribute("data-count", "1");
  });
});
