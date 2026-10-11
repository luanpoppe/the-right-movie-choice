import { beforeEach, describe, expect, it, vi } from "vitest";
import { Logger } from "@/lib/logger/logger";
import type { MovieCatalogDetails } from "../../../domain/entities/movie-catalog-details.entity";
import type {
  MovieSearchHit,
  MovieSearchPage,
} from "../../../domain/entities/movie-search.entity";
import { MovieCatalogSearchValidationException } from "../../../domain/movie-catalog-search.constants";
import type { IMovieCatalogProvider } from "../../providers/movie-catalog.provider";
import { SearchCatalogMoviesUseCase } from "../search-catalog-movies.use-case";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function createCatalogMock(): IMovieCatalogProvider {
  return {
    searchMovies: vi.fn(),
    getMovieDetails: vi.fn(),
    searchPeople: vi.fn(),
    searchKeywords: vi.fn(),
    discoverMovies: vi.fn(),
  } as unknown as IMovieCatalogProvider;
}

function createDetails(tmdbId: number): MovieCatalogDetails {
  return {
    tmdbId,
    title: `Movie ${tmdbId}`,
    year: 2014,
    posterPath: null,
    overview: "",
    runtimeMinutes: null,
    genres: [],
    tmdbVoteAverage: null,
    originCountries: [],
    directors: [],
    cast: [],
    watchProviders: { flatrate: [], rent: [], buy: [] },
    imdbId: null,
  };
}

const HITS: MovieSearchHit[] = [
  { id: 1, title: "One", year: 2014, posterPath: null, overview: "" },
  { id: 2, title: "Two", year: 2014, posterPath: null, overview: "" },
];

describe("SearchCatalogMoviesUseCase", () => {
  let catalog: IMovieCatalogProvider;
  let enqueuePersist: (details: MovieCatalogDetails, language: string) => Promise<void>;
  let useCase: SearchCatalogMoviesUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    catalog = createCatalogMock();
    enqueuePersist = vi.fn().mockResolvedValue(undefined);
    useCase = new SearchCatalogMoviesUseCase(catalog, enqueuePersist);
  });

  it("REQ-1: busca por texto repassa query, página, ano e en-US ao provider", async () => {
    const page: MovieSearchPage = { page: 1, results: [] };
    vi.mocked(catalog.searchMovies).mockResolvedValue(page);

    const result = await useCase.execute({
      query: "Interstellar",
      year: 2014,
      page: 1,
    });

    expect(catalog.searchMovies).toHaveBeenCalledWith(
      "Interstellar",
      1,
      2014,
      "en-US",
    );
    expect(result).toBe(page);
  });

  it("REQ-1: enfileira cada hit da página com o idioma resolvido", async () => {
    vi.mocked(catalog.searchMovies).mockResolvedValue({ page: 1, results: HITS });
    vi.mocked(catalog.getMovieDetails).mockImplementation(async (id) =>
      createDetails(id),
    );

    await useCase.execute({ query: "Interstellar", language: "pt-BR" });

    await vi.waitFor(() => {
      expect(enqueuePersist).toHaveBeenCalledTimes(2);
    });
    expect(catalog.getMovieDetails).toHaveBeenCalledWith(1, "pt-BR");
    expect(catalog.getMovieDetails).toHaveBeenCalledWith(2, "pt-BR");
    expect(enqueuePersist).toHaveBeenNthCalledWith(
      1,
      createDetails(1),
      "pt-BR",
    );
    expect(enqueuePersist).toHaveBeenNthCalledWith(
      2,
      createDetails(2),
      "pt-BR",
    );
  });

  it("remove espaços do texto antes de consultar o provider", async () => {
    vi.mocked(catalog.searchMovies).mockResolvedValue({ page: 1, results: [] });

    await useCase.execute({ query: "  Interstellar  " });

    expect(catalog.searchMovies).toHaveBeenCalledWith(
      "Interstellar",
      undefined,
      undefined,
      "en-US",
    );
  });

  it("REQ-2: query vazia vira discover em pt-BR sem chamar searchMovies", async () => {
    const popularPage: MovieSearchPage = { page: 1, results: [] };
    vi.mocked(catalog.discoverMovies).mockResolvedValue(popularPage);

    const result = await useCase.execute({ query: "", language: "pt-BR" });

    expect(catalog.searchMovies).not.toHaveBeenCalled();
    expect(catalog.discoverMovies).toHaveBeenCalledWith({ language: "pt-BR" });
    expect(result).toBe(popularPage);
  });

  it("REQ-2: query só com espaços vira discover e repassa a página", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 3, results: [] });

    await useCase.execute({ query: "   ", page: 3 });

    expect(catalog.searchMovies).not.toHaveBeenCalled();
    expect(catalog.discoverMovies).toHaveBeenCalledWith({
      language: "en-US",
      page: 3,
    });
  });

  it("REQ-2: no modo discover enfileira os hits retornados", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 1, results: HITS });
    vi.mocked(catalog.getMovieDetails).mockImplementation(async (id) =>
      createDetails(id),
    );

    await useCase.execute({ query: "", language: "pt-BR" });

    await vi.waitFor(() => {
      expect(enqueuePersist).toHaveBeenCalledTimes(2);
    });
  });

  it("REQ-5: rejeita idioma inválido sem chamar o provider", async () => {
    await expect(useCase.execute({ query: "X", language: "fr-FR" })).rejects.toBeInstanceOf(
      MovieCatalogSearchValidationException,
    );

    expect(catalog.searchMovies).not.toHaveBeenCalled();
    expect(catalog.discoverMovies).not.toHaveBeenCalled();
    expect(enqueuePersist).not.toHaveBeenCalled();
  });

  it("REQ-6: erro do TMDB na busca sobe e não enfileira", async () => {
    vi.mocked(catalog.searchMovies).mockRejectedValue(
      new Error("TMDB upstream unavailable"),
    );

    await expect(useCase.execute({ query: "Interstellar" })).rejects.toThrow(
      "TMDB upstream unavailable",
    );

    expect(enqueuePersist).not.toHaveBeenCalled();
  });

  it("REQ-6: erro do TMDB no discover sobe e não enfileira", async () => {
    vi.mocked(catalog.discoverMovies).mockRejectedValue(
      new Error("TMDB upstream unavailable"),
    );

    await expect(useCase.execute({ query: "" })).rejects.toThrow(
      "TMDB upstream unavailable",
    );

    expect(enqueuePersist).not.toHaveBeenCalled();
  });

  it("edge: fila rejeitando o enqueue não derruba a resposta 200", async () => {
    vi.mocked(catalog.searchMovies).mockResolvedValue({ page: 1, results: HITS });
    vi.mocked(catalog.getMovieDetails).mockImplementation(async (id) =>
      createDetails(id),
    );
    vi.mocked(enqueuePersist).mockRejectedValue(new Error("queue down"));

    const result = await useCase.execute({ query: "Interstellar" });

    expect(result).toEqual({ page: 1, results: HITS });
    await vi.waitFor(() => {
      expect(enqueuePersist).toHaveBeenCalledTimes(2);
    });
    expect(Logger.warn).toHaveBeenCalledWith(
      "Failed to enqueue catalog persist for search hit",
      expect.objectContaining({ tmdbId: 1, language: "en-US" }),
    );
  });

  it("edge: falha ao buscar detalhes de um hit não derruba a resposta", async () => {
    vi.mocked(catalog.searchMovies).mockResolvedValue({ page: 1, results: HITS });
    vi.mocked(catalog.getMovieDetails).mockRejectedValue(
      new Error("details failed"),
    );

    const result = await useCase.execute({ query: "Interstellar" });

    expect(result).toEqual({ page: 1, results: HITS });
    await vi.waitFor(() => {
      expect(catalog.getMovieDetails).toHaveBeenCalledTimes(2);
    });
    expect(enqueuePersist).not.toHaveBeenCalled();
    expect(Logger.warn).toHaveBeenCalledWith(
      "Failed to enqueue catalog persist for search hit",
      expect.objectContaining({ tmdbId: 1, errorMessage: "details failed" }),
    );
  });
});
