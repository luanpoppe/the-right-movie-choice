import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import type {
  IMovieCatalogRepository,
  MovieCatalogStoredRecord,
} from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { ChatHistoryCatalogEnrichmentUtils } from "../chat-history-catalog-enrichment.utils";

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
}

describe("ChatHistoryCatalogEnrichmentUtils", () => {
  let catalogRepository: IMovieCatalogRepository;

  beforeEach(() => {
    catalogRepository = {
      findByTmdbId: vi.fn(),
      findByTitleAndYear: vi.fn(),
      findByTitlesAndYears: vi.fn(),
      upsert: vi.fn(),
    };
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
    );

    const aiTuple = enriched[1];
    expect(aiTuple?.[2]?.[0]?.posterPath).toBe(
      "https://image.tmdb.org/t/p/w500/poster.jpg",
    );
    expect(catalogRepository.findByTmdbId).toHaveBeenCalledWith(530385);
  });

  it("mantém tuplas sem filmes inalteradas", async () => {
    const history: ChatHistoryEntity = [
      ["user", "oi"],
      ["ai", "olá"],
    ];

    const enriched = await ChatHistoryCatalogEnrichmentUtils.enrichMoviePosters(
      history,
      catalogRepository,
    );

    expect(enriched).toEqual(history);
    expect(catalogRepository.findByTmdbId).not.toHaveBeenCalled();
  });
});
