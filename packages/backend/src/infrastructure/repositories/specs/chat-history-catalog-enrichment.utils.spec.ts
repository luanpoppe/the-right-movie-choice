import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type { MovieCatalogLookupResult } from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import type {
  IMovieCatalogRepository,
  MovieCatalogStoredRecord,
} from "@/domains/movies/domain/repositories/movie-catalog.repository";
import type { MovieCatalogLookupService } from "@/domains/movies/infrastructure/providers/movie-catalog-lookup.service";
import { ChatHistoryCatalogEnrichmentUtils } from "../chat-history-catalog-enrichment.utils";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class ChatHistoryCatalogEnrichmentFixtures {
  static catalogDetails(
    overrides: Partial<MovieCatalogDetails> = {},
  ): MovieCatalogDetails {
    return {
      tmdbId: 530385,
      title: "Midsommar",
      year: 2019,
      posterPath: "/poster.jpg",
      overview: "overview",
      runtimeMinutes: 148,
      genres: [],
      tmdbVoteAverage: 7.1,
      originCountries: ["US"],
      directors: ["Ari Aster"],
      cast: ["Florence Pugh"],
      watchProviders: {
        flatrate: [],
        rent: [],
        buy: [],
      },
      imdbId: "tt8772262",
      ...overrides,
    };
  }

  static storedRecord(
    details: MovieCatalogDetails,
  ): MovieCatalogStoredRecord {
    return {
      details,
      updatedAt: new Date("2026-09-17T00:00:00.000Z"),
    };
  }

  static lookupFound(details: MovieCatalogDetails): MovieCatalogLookupResult {
    return { found: true, details };
  }

  static lookupMiss(): MovieCatalogLookupResult {
    return { found: false, message: "Nenhum filme encontrado" };
  }
}

describe("ChatHistoryCatalogEnrichmentUtils", () => {
  let catalogRepository: IMovieCatalogRepository;
  let catalogLookup: MovieCatalogLookupService;

  beforeEach(() => {
    catalogRepository = {
      findByTmdbId: vi.fn().mockResolvedValue(null),
      findByTitleAndYear: vi.fn(),
      findByTitlesAndYears: vi.fn(),
      upsert: vi.fn(),
    };
    catalogLookup = {
      findDetailsByTitle: vi
        .fn()
        .mockResolvedValue(ChatHistoryCatalogEnrichmentFixtures.lookupMiss()),
    } as unknown as MovieCatalogLookupService;
  });

  it("enriquece posterPath dos filmes via catálogo por tmdbId", async () => {
    const catalogDetails =
      ChatHistoryCatalogEnrichmentFixtures.catalogDetails();
    const storedRecord =
      ChatHistoryCatalogEnrichmentFixtures.storedRecord(catalogDetails);
    vi.mocked(catalogRepository.findByTmdbId).mockResolvedValue(storedRecord);

    const history: ChatHistoryEntity = [
      ["user", "horror movies"],
      [
        "ai",
        "Try Midsommar",
        [{ title: "Midsommar", tmdbId: 530385 }],
      ],
    ];

    const enriched = await ChatHistoryCatalogEnrichmentUtils.enrichMoviePosters(
      history,
      catalogRepository,
      catalogLookup,
    );

    const aiTuple = enriched[1];
    expect(aiTuple?.[2]?.[0]?.posterPath).toBe(
      "https://image.tmdb.org/t/p/w500/poster.jpg",
    );
    expect(catalogRepository.findByTmdbId).toHaveBeenCalledWith(530385);
    expect(catalogLookup.findDetailsByTitle).not.toHaveBeenCalled();
  });

  it("corrige tmdbId errado pelo título quando não há registro no catálogo", async () => {
    const resolvedDetails = ChatHistoryCatalogEnrichmentFixtures.catalogDetails(
      {
        tmdbId: 199575,
        title: "These Final Hours",
        year: 2014,
        posterPath: "/final-hours.jpg",
        imdbId: "tt2915134",
      },
    );
    vi.mocked(catalogLookup.findDetailsByTitle).mockResolvedValue(
      ChatHistoryCatalogEnrichmentFixtures.lookupFound(resolvedDetails),
    );

    const history: ChatHistoryEntity = [
      [
        "ai",
        "Separei três opções",
        [
          {
            title: "These Final Hours",
            releaseYear: 2013,
            tmdbId: 227700,
            imdbId: "tt0000000",
          },
        ],
      ],
    ];

    const enriched = await ChatHistoryCatalogEnrichmentUtils.enrichMoviePosters(
      history,
      catalogRepository,
      catalogLookup,
    );

    const enrichedMovie = enriched[0]?.[2]?.[0];
    expect(catalogLookup.findDetailsByTitle).toHaveBeenCalledWith({
      query: "These Final Hours",
      year: 2013,
    });
    expect(enrichedMovie?.tmdbId).toBe(199575);
    expect(enrichedMovie?.imdbId).toBe("tt2915134");
    expect(enrichedMovie?.posterPath).toBe(
      "https://image.tmdb.org/t/p/w500/final-hours.jpg",
    );
  });

  it("resolve filme sem tmdbId pelo título", async () => {
    const resolvedDetails = ChatHistoryCatalogEnrichmentFixtures.catalogDetails(
      {
        tmdbId: 38541,
        title: "The Divide",
        year: 2012,
        posterPath: "/the-divide.jpg",
      },
    );
    vi.mocked(catalogLookup.findDetailsByTitle).mockResolvedValue(
      ChatHistoryCatalogEnrichmentFixtures.lookupFound(resolvedDetails),
    );

    const history: ChatHistoryEntity = [
      ["ai", "Sugestão", [{ title: "The Divide", releaseYear: 2011 }]],
    ];

    const enriched = await ChatHistoryCatalogEnrichmentUtils.enrichMoviePosters(
      history,
      catalogRepository,
      catalogLookup,
    );

    const enrichedMovie = enriched[0]?.[2]?.[0];
    expect(catalogLookup.findDetailsByTitle).toHaveBeenCalledWith({
      query: "The Divide",
      year: 2011,
    });
    expect(enrichedMovie?.tmdbId).toBe(38541);
    expect(enrichedMovie?.posterPath).toBe(
      "https://image.tmdb.org/t/p/w500/the-divide.jpg",
    );
  });

  it("mantém tmdbId e devolve posterPath null quando o título não resolve", async () => {
    const history: ChatHistoryEntity = [
      [
        "ai",
        "Sugestão",
        [{ title: "Filme Desconhecido", tmdbId: 999999 }],
      ],
    ];

    const enriched = await ChatHistoryCatalogEnrichmentUtils.enrichMoviePosters(
      history,
      catalogRepository,
      catalogLookup,
    );

    const enrichedMovie = enriched[0]?.[2]?.[0];
    expect(catalogLookup.findDetailsByTitle).toHaveBeenCalledWith({
      query: "Filme Desconhecido",
    });
    expect(enrichedMovie?.tmdbId).toBe(999999);
    expect(enrichedMovie?.posterPath).toBeNull();
  });

  it("mantém tuplas sem filmes inalteradas", async () => {
    const history: ChatHistoryEntity = [
      ["user", "oi"],
      ["ai", "olá"],
    ];

    const enriched = await ChatHistoryCatalogEnrichmentUtils.enrichMoviePosters(
      history,
      catalogRepository,
      catalogLookup,
    );

    expect(enriched).toEqual(history);
    expect(catalogRepository.findByTmdbId).not.toHaveBeenCalled();
    expect(catalogLookup.findDetailsByTitle).not.toHaveBeenCalled();
  });
});
