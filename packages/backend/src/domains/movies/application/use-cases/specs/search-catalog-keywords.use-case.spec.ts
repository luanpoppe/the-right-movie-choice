import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MovieKeywordSearchPage } from "../../../domain/entities/movie-keyword-search.entity";
import { MovieCatalogSearchValidationException } from "../../../domain/movie-catalog-search.constants";
import type { IMovieCatalogProvider } from "../../providers/movie-catalog.provider";
import { SearchCatalogKeywordsUseCase } from "../search-catalog-keywords.use-case";

function createCatalogMock(): IMovieCatalogProvider {
  return {
    searchMovies: vi.fn(),
    getMovieDetails: vi.fn(),
    searchPeople: vi.fn(),
    searchKeywords: vi.fn(),
    discoverMovies: vi.fn(),
  } as unknown as IMovieCatalogProvider;
}

const KEYWORDS_PAGE: MovieKeywordSearchPage = {
  page: 1,
  results: [
    { id: 4379, name: "time travel" },
    { id: 123, name: "time loop" },
  ],
};

describe("SearchCatalogKeywordsUseCase", () => {
  let catalog: IMovieCatalogProvider;
  let useCase: SearchCatalogKeywordsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    catalog = createCatalogMock();
    useCase = new SearchCatalogKeywordsUseCase(catalog);
  });

  it("REQ-7: busca palavras-chave e devolve id e nome de cada termo", async () => {
    vi.mocked(catalog.searchKeywords).mockResolvedValue(KEYWORDS_PAGE);

    const result = await useCase.execute({ query: "time travel" });

    expect(catalog.searchKeywords).toHaveBeenCalledWith(
      "time travel",
      undefined,
    );
    expect(result).toBe(KEYWORDS_PAGE);
    expect(result.results).toEqual([
      { id: 4379, name: "time travel" },
      { id: 123, name: "time loop" },
    ]);
  });

  it("REQ-7: repassa a página explícita", async () => {
    vi.mocked(catalog.searchKeywords).mockResolvedValue(KEYWORDS_PAGE);

    await useCase.execute({ query: "time travel", page: 3 });

    expect(catalog.searchKeywords).toHaveBeenCalledWith("time travel", 3);
  });

  it("REQ-7: remove espaços da query antes de consultar", async () => {
    vi.mocked(catalog.searchKeywords).mockResolvedValue(KEYWORDS_PAGE);

    await useCase.execute({ query: "  time travel  " });

    expect(catalog.searchKeywords).toHaveBeenCalledWith(
      "time travel",
      undefined,
    );
  });

  it("REQ-7 erro: query vazia lança validação sem chamar o provider", async () => {
    await expect(useCase.execute({ query: "" })).rejects.toBeInstanceOf(
      MovieCatalogSearchValidationException,
    );

    expect(catalog.searchKeywords).not.toHaveBeenCalled();
  });

  it("REQ-7 erro: query só com espaços lança validação", async () => {
    await expect(useCase.execute({ query: "   " })).rejects.toBeInstanceOf(
      MovieCatalogSearchValidationException,
    );

    expect(catalog.searchKeywords).not.toHaveBeenCalled();
  });

  it("REQ-7: não chama discover nem busca de filme", async () => {
    vi.mocked(catalog.searchKeywords).mockResolvedValue(KEYWORDS_PAGE);

    await useCase.execute({ query: "time travel" });

    expect(catalog.discoverMovies).not.toHaveBeenCalled();
    expect(catalog.searchMovies).not.toHaveBeenCalled();
  });
});
