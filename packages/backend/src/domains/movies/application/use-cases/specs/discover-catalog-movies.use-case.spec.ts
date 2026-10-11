import { beforeEach, describe, expect, it, vi } from "vitest";
import { Logger } from "@/lib/logger/logger";
import type { MovieCatalogDetails } from "../../../domain/entities/movie-catalog-details.entity";
import type {
  MovieDiscoverQuery,
} from "../../../domain/entities/movie-discover-query.entity";
import type { MovieSearchHit } from "../../../domain/entities/movie-search.entity";
import { MovieCatalogSearchValidationException } from "../../../domain/movie-catalog-search.constants";
import type { IMovieCatalogProvider } from "../../providers/movie-catalog.provider";
import { DiscoverCatalogMoviesUseCase } from "../discover-catalog-movies.use-case";

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
    year: 2010,
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
  { id: 10, title: "Ten", year: 2010, posterPath: null, overview: "" },
];

describe("DiscoverCatalogMoviesUseCase", () => {
  let catalog: IMovieCatalogProvider;
  let enqueuePersist: (details: MovieCatalogDetails, language: string) => Promise<void>;
  let useCase: DiscoverCatalogMoviesUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    catalog = createCatalogMock();
    enqueuePersist = vi.fn().mockResolvedValue(undefined);
    useCase = new DiscoverCatalogMoviesUseCase(catalog, enqueuePersist);
  });

  it("REQ-3: repassa filtros e resolve idioma pt-BR ao provider", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 2, results: [] });
    const input: MovieDiscoverQuery = {
      genres: [28, 35],
      minRating: 7,
      yearFrom: 2010,
      yearTo: 2015,
      page: 2,
      language: "pt-BR",
    };

    const result = await useCase.execute(input);

    expect(catalog.discoverMovies).toHaveBeenCalledWith({
      ...input,
      language: "pt-BR",
    });
    expect(result).toEqual({ page: 2, results: [] });
  });

  it("REQ-4: discover sem filtros usa en-US e mantém a página", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 1, results: [] });

    await useCase.execute({ page: 1 });

    expect(catalog.discoverMovies).toHaveBeenCalledWith({
      page: 1,
      language: "en-US",
    });
  });

  it("REQ-4: resolve idioma vazio para en-US", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 1, results: [] });

    await useCase.execute({ language: "" });

    expect(catalog.discoverMovies).toHaveBeenCalledWith({ language: "en-US" });
  });

  it("REQ-8: repassa elenco, direção, palavra-chave, duração e certificação", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 1, results: [] });
    const input: MovieDiscoverQuery = {
      cast: [234352, 6193],
      director: [525],
      keyword: [4379],
      runtimeFrom: 90,
      runtimeTo: 140,
      certificationCountry: "BR",
      certification: "14",
    };

    await useCase.execute(input);

    expect(catalog.discoverMovies).toHaveBeenCalledWith({
      cast: [234352, 6193],
      director: [525],
      keyword: [4379],
      runtimeFrom: 90,
      runtimeTo: 140,
      certificationCountry: "BR",
      certification: "14",
      language: "en-US",
    });
  });

  it("REQ-8: aceita várias palavras-chave no mesmo pedido", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 1, results: [] });

    await useCase.execute({ keyword: [4379, 123] });

    expect(catalog.discoverMovies).toHaveBeenCalledWith({
      keyword: [4379, 123],
      language: "en-US",
    });
  });

  it("REQ-3: enfileira cada hit do discover", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 1, results: HITS });
    vi.mocked(catalog.getMovieDetails).mockImplementation(async (id) =>
      createDetails(id),
    );

    await useCase.execute({ language: "pt-BR" });

    await vi.waitFor(() => {
      expect(enqueuePersist).toHaveBeenCalledTimes(1);
    });
    expect(catalog.getMovieDetails).toHaveBeenCalledWith(10, "pt-BR");
    expect(enqueuePersist).toHaveBeenCalledWith(createDetails(10), "pt-BR");
  });

  it.each<MovieDiscoverQuery>([
    { language: "fr-FR" },
    { page: 0 },
    { minRating: 11 },
    { minRating: -1 },
    { yearFrom: 2015, yearTo: 2010 },
    { yearFrom: 0 },
    { runtimeFrom: 140, runtimeTo: 90 },
    { certification: "14" },
    { certificationCountry: "BR" },
    { cast: [0] },
    { director: [-1] },
    { keyword: [1.5] },
    { genres: [0] },
  ])("REQ-5: rejeita query inválida %j sem chamar o provider", async (input) => {
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      MovieCatalogSearchValidationException,
    );

    expect(catalog.discoverMovies).not.toHaveBeenCalled();
    expect(enqueuePersist).not.toHaveBeenCalled();
  });

  it("REQ-6: erro do TMDB sobe e não enfileira", async () => {
    vi.mocked(catalog.discoverMovies).mockRejectedValue(
      new Error("TMDB upstream unavailable"),
    );

    await expect(useCase.execute({ page: 1 })).rejects.toThrow(
      "TMDB upstream unavailable",
    );

    expect(enqueuePersist).not.toHaveBeenCalled();
  });

  it("edge: fila rejeitando o enqueue não derruba a resposta", async () => {
    vi.mocked(catalog.discoverMovies).mockResolvedValue({ page: 1, results: HITS });
    vi.mocked(catalog.getMovieDetails).mockImplementation(async (id) =>
      createDetails(id),
    );
    vi.mocked(enqueuePersist).mockRejectedValue(new Error("queue down"));

    const result = await useCase.execute({ language: "pt-BR" });

    expect(result).toEqual({ page: 1, results: HITS });
    await vi.waitFor(() => {
      expect(enqueuePersist).toHaveBeenCalledTimes(1);
    });
    expect(Logger.warn).toHaveBeenCalledWith(
      "Failed to enqueue catalog persist for discover hit",
      expect.objectContaining({ tmdbId: 10, language: "pt-BR" }),
    );
  });
});
