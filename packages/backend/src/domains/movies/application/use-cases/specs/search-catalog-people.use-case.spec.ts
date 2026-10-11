import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MoviePersonSearchPage } from "../../../domain/entities/movie-person-search.entity";
import { MovieCatalogSearchValidationException } from "../../../domain/movie-catalog-search.constants";
import type { IMovieCatalogProvider } from "../../providers/movie-catalog.provider";
import { SearchCatalogPeopleUseCase } from "../search-catalog-people.use-case";

function createCatalogMock(): IMovieCatalogProvider {
  return {
    searchMovies: vi.fn(),
    getMovieDetails: vi.fn(),
    searchPeople: vi.fn(),
    searchKeywords: vi.fn(),
    discoverMovies: vi.fn(),
  } as unknown as IMovieCatalogProvider;
}

const PEOPLE_PAGE: MoviePersonSearchPage = {
  page: 1,
  results: [
    {
      id: 525,
      name: "Christopher Nolan",
      knownForDepartment: "Directing",
      knownFor: [{ id: 27205, title: "Inception" }],
    },
  ],
};

describe("SearchCatalogPeopleUseCase", () => {
  let catalog: IMovieCatalogProvider;
  let useCase: SearchCatalogPeopleUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    catalog = createCatalogMock();
    useCase = new SearchCatalogPeopleUseCase(catalog);
  });

  it("REQ-7: busca pessoas com en-US e devolve os candidatos", async () => {
    vi.mocked(catalog.searchPeople).mockResolvedValue(PEOPLE_PAGE);

    const result = await useCase.execute({ query: "Nolan" });

    expect(catalog.searchPeople).toHaveBeenCalledWith(
      "Nolan",
      undefined,
      "en-US",
    );
    expect(result).toBe(PEOPLE_PAGE);
  });

  it("REQ-7: repassa página e idioma explícito", async () => {
    vi.mocked(catalog.searchPeople).mockResolvedValue(PEOPLE_PAGE);

    await useCase.execute({ query: "Nolan", page: 2, language: "pt-BR" });

    expect(catalog.searchPeople).toHaveBeenCalledWith("Nolan", 2, "pt-BR");
  });

  it("REQ-7: remove espaços da query antes de consultar", async () => {
    vi.mocked(catalog.searchPeople).mockResolvedValue(PEOPLE_PAGE);

    await useCase.execute({ query: "  Nolan  " });

    expect(catalog.searchPeople).toHaveBeenCalledWith(
      "Nolan",
      undefined,
      "en-US",
    );
  });

  it("REQ-7 erro: query vazia lança validação sem chamar o provider", async () => {
    await expect(useCase.execute({ query: "" })).rejects.toBeInstanceOf(
      MovieCatalogSearchValidationException,
    );

    expect(catalog.searchPeople).not.toHaveBeenCalled();
  });

  it("REQ-7 erro: query só com espaços lança validação", async () => {
    await expect(useCase.execute({ query: "   " })).rejects.toBeInstanceOf(
      MovieCatalogSearchValidationException,
    );

    expect(catalog.searchPeople).not.toHaveBeenCalled();
  });

  it("REQ-7: não enfileira filme e não chama discover", async () => {
    vi.mocked(catalog.searchPeople).mockResolvedValue(PEOPLE_PAGE);

    await useCase.execute({ query: "Nolan" });

    expect(catalog.discoverMovies).not.toHaveBeenCalled();
    expect(catalog.searchMovies).not.toHaveBeenCalled();
  });

  it("rejeita idioma inválido mesmo com query válida", async () => {
    await expect(
      useCase.execute({ query: "Nolan", language: "fr-FR" }),
    ).rejects.toBeInstanceOf(MovieCatalogSearchValidationException);

    expect(catalog.searchPeople).not.toHaveBeenCalled();
  });
});
