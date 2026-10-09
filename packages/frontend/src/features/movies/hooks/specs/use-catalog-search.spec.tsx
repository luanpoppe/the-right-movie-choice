jest.mock("../../services/movie-catalog-search.service", () => ({
  MovieCatalogSearchService: {
    searchMovies: jest.fn(),
    discoverMovies: jest.fn(),
  },
}));

import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { MovieSearchHit } from "../../dto/movie-catalog-search.dto";
import { MovieCatalogSearchService } from "../../services/movie-catalog-search.service";
import { useCatalogSearch } from "../use-catalog-search";

const mockedSearchMovies = jest.mocked(
  MovieCatalogSearchService.searchMovies,
);
const mockedDiscoverMovies = jest.mocked(
  MovieCatalogSearchService.discoverMovies,
);

class CatalogSearchHookFixtures {
  static hit(overrides: Partial<MovieSearchHit> = {}): MovieSearchHit {
    return {
      id: 157336,
      title: "Interstellar",
      year: 2014,
      posterPath: null,
      overview: "A team travels through a wormhole.",
      ...overrides,
    };
  }

  static page(hits: MovieSearchHit[]) {
    return { page: 1, results: hits };
  }
}

function renderCatalogSearchHook(initialEntry = "/search") {
  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  );

  return renderHook(() => useCatalogSearch(), { wrapper });
}

describe("useCatalogSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSearchMovies.mockResolvedValue(
      CatalogSearchHookFixtures.page([CatalogSearchHookFixtures.hit()]),
    );
    mockedDiscoverMovies.mockResolvedValue(
      CatalogSearchHookFixtures.page([CatalogSearchHookFixtures.hit()]),
    );
  });

  it("REQ-1: abrir /search sem filtros chama busca sem query e mostra populares", async () => {
    const { result } = renderCatalogSearchHook("/search");

    await waitFor(() => {
      expect(mockedSearchMovies).toHaveBeenCalledWith({
        query: undefined,
        page: 1,
        language: undefined,
      });
    });

    expect(mockedDiscoverMovies).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });
    expect(result.current.error).toBeNull();
  });

  it("REQ-2: query na URL chama searchMovies com query e page 1", async () => {
    renderCatalogSearchHook("/search?query=Interstellar");

    await waitFor(() => {
      expect(mockedSearchMovies).toHaveBeenCalledWith({
        query: "Interstellar",
        page: 1,
        language: undefined,
      });
    });
    expect(mockedDiscoverMovies).not.toHaveBeenCalled();
  });

  it("REQ-3: filtros de discover na URL chamam discoverMovies", async () => {
    renderCatalogSearchHook(
      "/search?genres=18&minRating=7&yearFrom=2010&yearTo=2015",
    );

    await waitFor(() => {
      expect(mockedDiscoverMovies).toHaveBeenCalledWith(
        expect.objectContaining({
          genres: [18],
          minRating: 7,
          yearFrom: 2010,
          yearTo: 2015,
        }),
        1,
        undefined,
      );
    });
    expect(mockedSearchMovies).not.toHaveBeenCalled();
  });

  it("edge: filtros inválidos não chamam a API e expõem erros", async () => {
    const { result } = renderCatalogSearchHook("/search?minRating=12");

    await waitFor(() => {
      expect(result.current.errors).toHaveLength(1);
    });

    expect(mockedSearchMovies).not.toHaveBeenCalled();
    expect(mockedDiscoverMovies).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it("edge: query combinada com discover é inválida e não chama a API", async () => {
    const { result } = renderCatalogSearchHook(
      "/search?query=Interstellar&genres=18",
    );

    await waitFor(() => {
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    expect(mockedSearchMovies).not.toHaveBeenCalled();
    expect(mockedDiscoverMovies).not.toHaveBeenCalled();
  });

  it("REQ-9: falha na busca expõe error e mantém lista vazia", async () => {
    mockedSearchMovies.mockRejectedValue(new Error("catalog down"));

    const { result } = renderCatalogSearchHook("/search?query=Interstellar");

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe("catalog down");
    expect(result.current.loading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it("REQ-5: loadMore busca a página seguinte e anexa resultados", async () => {
    const firstHit = CatalogSearchHookFixtures.hit({ id: 1, title: "First" });
    const secondHit = CatalogSearchHookFixtures.hit({ id: 2, title: "Second" });

    mockedSearchMovies
      .mockResolvedValueOnce(CatalogSearchHookFixtures.page([firstHit]))
      .mockResolvedValueOnce(CatalogSearchHookFixtures.page([secondHit]));

    const { result } = renderCatalogSearchHook("/search?query=Interstellar");

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(2);
    });

    expect(mockedSearchMovies).toHaveBeenLastCalledWith({
      query: "Interstellar",
      page: 2,
      language: undefined,
    });
    expect(result.current.results.map((hit) => hit.id)).toEqual([1, 2]);
  });

  it("REQ-6: setLanguage refaz a busca com pt-BR", async () => {
    const { result } = renderCatalogSearchHook("/search?query=Interstellar");

    await waitFor(() => {
      expect(mockedSearchMovies).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setLanguage("pt-BR");
    });

    await waitFor(() => {
      expect(mockedSearchMovies).toHaveBeenLastCalledWith({
        query: "Interstellar",
        page: 1,
        language: "pt-BR",
      });
    });
  });

  it("REQ-2: search aplica o texto digitado e descarta filtros de discover", async () => {
    const { result } = renderCatalogSearchHook("/search?genres=18");

    await waitFor(() => {
      expect(mockedDiscoverMovies).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.search("  Interstellar  ");
    });

    await waitFor(() => {
      expect(mockedSearchMovies).toHaveBeenCalledWith({
        query: "Interstellar",
        page: 1,
        language: undefined,
      });
    });
  });

  it("REQ-9 edge: retry refaz a busca após erro", async () => {
    mockedSearchMovies.mockRejectedValueOnce(new Error("catalog down"));

    const { result } = renderCatalogSearchHook("/search?query=Interstellar");

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    mockedSearchMovies.mockResolvedValue(
      CatalogSearchHookFixtures.page([CatalogSearchHookFixtures.hit()]),
    );

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
    expect(mockedSearchMovies).toHaveBeenCalledTimes(2);
  });

  it("REQ-6 edge: setLanguage preserva os filtros de discover", async () => {
    const { result } = renderCatalogSearchHook("/search?genres=18&minRating=7");

    await waitFor(() => {
      expect(mockedDiscoverMovies).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setLanguage("pt-BR");
    });

    await waitFor(() => {
      expect(mockedDiscoverMovies).toHaveBeenLastCalledWith(
        expect.objectContaining({ genres: [18], minRating: 7 }),
        1,
        "pt-BR",
      );
    });
  });

  it("REQ-4: applyFilters de discover limpa query e reseta a página", async () => {
    const { result } = renderCatalogSearchHook(
      "/search?query=Interstellar&page=2",
    );

    await waitFor(() => {
      expect(mockedSearchMovies).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.applyFilters({ genres: [18], minRating: 7 });
    });

    await waitFor(() => {
      expect(mockedDiscoverMovies).toHaveBeenCalledWith(
        expect.objectContaining({ genres: [18], minRating: 7 }),
        1,
        undefined,
      );
    });
    expect(result.current.filters.query).toBeUndefined();
    expect(result.current.page).toBe(1);
  });

  it("edge: erro que não é Error é convertido em Error", async () => {
    mockedSearchMovies.mockRejectedValue("boom");

    const { result } = renderCatalogSearchHook("/search?query=Interstellar");

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe("boom");
  });

  it("M1: busca nova com falha limpa os resultados anteriores e expõe erro", async () => {
    const { result } = renderCatalogSearchHook("/search?query=Interstellar");

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    mockedSearchMovies.mockRejectedValueOnce(new Error("catalog down"));

    act(() => {
      result.current.search("zzz");
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe("catalog down");
    expect(result.current.results).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it("M1: falha no append (loadMore) mantém os itens já carregados", async () => {
    const firstHit = CatalogSearchHookFixtures.hit({ id: 1, title: "First" });

    mockedSearchMovies
      .mockResolvedValueOnce(CatalogSearchHookFixtures.page([firstHit]))
      .mockRejectedValueOnce(new Error("page 2 down"));

    const { result } = renderCatalogSearchHook("/search?query=Interstellar");

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.results.map((hit) => hit.id)).toEqual([1]);
    expect(result.current.hasMore).toBe(true);
  });
});
