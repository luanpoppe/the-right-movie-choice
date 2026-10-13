import { movieClient } from "@/lib/api/movie-client";
import { MovieCatalogSearchService } from "../movie-catalog-search.service";

jest.mock("@/lib/api/movie-client", () => ({
  movieClient: {
    get: jest.fn(),
  },
}));

const mockedGet = jest.mocked(movieClient.get);

class MovieCatalogSearchFixtures {
  static hit(overrides: Record<string, unknown> = {}) {
    return {
      id: 157336,
      title: "Interstellar",
      year: 2014,
      posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
      overview: "A team travels through a wormhole.",
      voteAverage: 8.6,
      ...overrides,
    };
  }

  static searchPage() {
    return {
      page: 1,
      results: [MovieCatalogSearchFixtures.hit()],
    };
  }
}

describe("MovieCatalogSearchService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue({ data: MovieCatalogSearchFixtures.searchPage() });
  });

  it("REQ-2: searchMovies chama GET /movie/catalog/search com params", async () => {
    const result = await MovieCatalogSearchService.searchMovies({
      query: "Interstellar",
      page: 1,
      language: "en-US",
    });

    expect(mockedGet).toHaveBeenCalledWith("/movie/catalog/search", {
      params: { query: "Interstellar", page: 1, language: "en-US" },
    });
    expect(result.results[0]?.title).toBe("Interstellar");
  });

  it("REQ-1: searchMovies sem query não injeta query nos params", async () => {
    await MovieCatalogSearchService.searchMovies({ page: 1 });

    expect(mockedGet).toHaveBeenCalledWith("/movie/catalog/search", {
      params: { page: 1 },
    });
  });

  it("edge: searchMovies valida o payload com zod", async () => {
    mockedGet.mockResolvedValue({
      data: {
        page: 1,
        results: [MovieCatalogSearchFixtures.hit({ posterPath: "/relative.jpg" })],
      },
    });

    await expect(
      MovieCatalogSearchService.searchMovies({ query: "x" }),
    ).rejects.toThrow();
  });

  it("REQ-3: discoverMovies une listas em vírgula e mantém escalares", async () => {
    await MovieCatalogSearchService.discoverMovies(
      {
        genres: [18, 28],
        cast: [1, 2],
        director: [525],
        keyword: [100],
        minRating: 7,
        yearFrom: 2010,
        yearTo: 2015,
        runtimeFrom: 60,
        runtimeTo: 180,
        certificationCountry: "BR",
        certification: "14",
      },
      1,
      "en-US",
    );

    expect(mockedGet).toHaveBeenCalledWith("/movie/catalog/discover", {
      params: {
        genres: "18,28",
        cast: "1,2",
        director: "525",
        keyword: "100",
        minRating: 7,
        yearFrom: 2010,
        yearTo: 2015,
        runtimeFrom: 60,
        runtimeTo: 180,
        certificationCountry: "BR",
        certification: "14",
        page: 1,
        language: "en-US",
      },
    });
  });

  it("REQ-3 edge: discoverMovies omite listas vazias e campos ausentes", async () => {
    await MovieCatalogSearchService.discoverMovies({ genres: [], cast: [] });

    expect(mockedGet).toHaveBeenCalledWith("/movie/catalog/discover", {
      params: {},
    });
  });

  it("edge: discoverMovies só inclui page/language quando presentes", async () => {
    await MovieCatalogSearchService.discoverMovies({ genres: [18] });

    expect(mockedGet).toHaveBeenCalledWith("/movie/catalog/discover", {
      params: { genres: "18" },
    });
  });

  it("edge: discoverMovies sem argumentos usa filtros vazios", async () => {
    await MovieCatalogSearchService.discoverMovies();

    expect(mockedGet).toHaveBeenCalledWith("/movie/catalog/discover", {
      params: {},
    });
  });

  it("REQ-4: searchPeople chama GET /movie/catalog/people", async () => {
    mockedGet.mockResolvedValue({
      data: {
        page: 1,
        results: [
          {
            id: 525,
            name: "Christopher Nolan",
            knownForDepartment: "Directing",
            knownFor: [{ id: 27205, title: "Inception" }],
          },
        ],
      },
    });

    const result = await MovieCatalogSearchService.searchPeople({
      query: "Nolan",
      language: "en-US",
    });

    expect(mockedGet).toHaveBeenCalledWith("/movie/catalog/people", {
      params: { query: "Nolan", language: "en-US" },
    });
    expect(result.results[0]?.name).toBe("Christopher Nolan");
  });

  it("REQ-4: searchKeywords chama GET /movie/catalog/keywords", async () => {
    mockedGet.mockResolvedValue({
      data: { page: 1, results: [{ id: 100, name: "dream" }] },
    });

    const result = await MovieCatalogSearchService.searchKeywords({
      query: "dream",
    });

    expect(mockedGet).toHaveBeenCalledWith("/movie/catalog/keywords", {
      params: { query: "dream" },
    });
    expect(result.results[0]?.name).toBe("dream");
  });
});
