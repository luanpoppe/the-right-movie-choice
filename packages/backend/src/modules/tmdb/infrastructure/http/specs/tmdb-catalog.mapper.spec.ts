import { describe, it, expect } from "vitest";
import type { TmdbMovieDetailsResponse } from "@/modules/tmdb/infrastructure/http/tmdb-movie-details-response.schema";
import { TmdbCatalogMapper } from "@/modules/tmdb/infrastructure/http/tmdb-catalog.mapper";
import type { TmdbSearchResponse } from "@/modules/tmdb/infrastructure/http/tmdb-search-response.schema";

const SEARCH_RESPONSE: TmdbSearchResponse = {
  page: 2,
  results: [
    {
      id: 11,
      title: "Star Wars",
      overview: "A long time ago",
      poster_path: "/poster.jpg",
      release_date: "1977-05-25",
    },
    {
      id: 22,
      title: "Untitled",
      overview: "",
      poster_path: null,
      release_date: "",
    },
  ],
};

function detailsFixture(
  overrides: Partial<TmdbMovieDetailsResponse> = {},
): TmdbMovieDetailsResponse {
  return {
    id: 11,
    title: "Star Wars",
    overview: "A long time ago",
    poster_path: "/poster.jpg",
    release_date: "1977-05-25",
    runtime: 121,
    vote_average: 8.2,
    genres: [{ name: "Adventure" }, { name: "Sci-Fi" }],
    origin_country: ["US"],
    credits: {
      crew: [
        { name: "George Lucas", job: "Director" },
        { name: "John Williams", job: "Original Music Composer" },
        { name: "Irvin Kershner", job: "Director" },
      ],
      cast: [
        { name: "Mark Hamill" },
        { name: "Harrison Ford" },
        { name: "Carrie Fisher" },
        { name: "Peter Cushing" },
        { name: "Alec Guinness" },
        { name: "Anthony Daniels" },
      ],
    },
    "watch/providers": {
      results: {
        BR: {
          flatrate: [{ provider_name: "Disney Plus", logo_path: "/d.png" }],
          rent: [{ provider_name: "Apple TV", logo_path: "/a.png" }],
          buy: [{ provider_name: "Amazon", logo_path: null }],
        },
      },
    },
    external_ids: { imdb_id: "tt0076759" },
    ...overrides,
  };
}

describe("TmdbCatalogMapper", () => {
  describe("toSearchPage", () => {
    it("maps hits with year from release_date and poster path without credits or providers", () => {
      const page = TmdbCatalogMapper.toSearchPage(SEARCH_RESPONSE);

      expect(page).toEqual({
        page: 2,
        results: [
          {
            id: 11,
            title: "Star Wars",
            year: 1977,
            posterPath: "/poster.jpg",
            overview: "A long time ago",
          },
          {
            id: 22,
            title: "Untitled",
            year: null,
            posterPath: null,
            overview: "",
          },
        ],
      });
      expect(page.results[0]).not.toHaveProperty("directors");
      expect(page.results[0]).not.toHaveProperty("cast");
      expect(page.results[0]).not.toHaveProperty("watchProviders");
    });

    it("maps empty search results to an empty array", () => {
      const page = TmdbCatalogMapper.toSearchPage({ page: 1, results: [] });

      expect(page).toEqual({ page: 1, results: [] });
    });
  });

  describe("toCatalogDetails", () => {
    it("maps directors by job, first five cast names and BR watch providers", () => {
      const details = TmdbCatalogMapper.toCatalogDetails(detailsFixture());

      expect(details.directors).toEqual(["George Lucas", "Irvin Kershner"]);
      expect(details.cast).toEqual([
        "Mark Hamill",
        "Harrison Ford",
        "Carrie Fisher",
        "Peter Cushing",
        "Alec Guinness",
      ]);
      expect(details.watchProviders).toEqual({
        flatrate: [{ providerName: "Disney Plus", logoPath: "/d.png" }],
        rent: [{ providerName: "Apple TV", logoPath: "/a.png" }],
        buy: [{ providerName: "Amazon", logoPath: null }],
      });
      expect(details.imdbId).toBe("tt0076759");
      expect(details.runtimeMinutes).toBe(121);
      expect(details.genres).toEqual(["Adventure", "Sci-Fi"]);
      expect(details.tmdbVoteAverage).toBe(8.2);
      expect(details.originCountries).toEqual(["US"]);
    });

    it("maps missing BR providers to empty arrays", () => {
      const details = TmdbCatalogMapper.toCatalogDetails(
        detailsFixture({
          "watch/providers": { results: {} },
        }),
      );

      expect(details.watchProviders).toEqual({
        flatrate: [],
        rent: [],
        buy: [],
      });
    });

    it("maps empty imdb id to null", () => {
      const details = TmdbCatalogMapper.toCatalogDetails(
        detailsFixture({
          external_ids: { imdb_id: "" },
        }),
      );

      expect(details.imdbId).toBeNull();
    });

    it("maps missing credits and providers to empty collections", () => {
      const details = TmdbCatalogMapper.toCatalogDetails(
        detailsFixture({
          credits: undefined,
          "watch/providers": undefined,
          external_ids: undefined,
          genres: undefined,
          origin_country: undefined,
          runtime: undefined,
          vote_average: undefined,
        }),
      );

      expect(details.directors).toEqual([]);
      expect(details.cast).toEqual([]);
      expect(details.watchProviders).toEqual({
        flatrate: [],
        rent: [],
        buy: [],
      });
      expect(details.imdbId).toBeNull();
      expect(details.genres).toEqual([]);
      expect(details.originCountries).toEqual([]);
      expect(details.runtimeMinutes).toBeNull();
      expect(details.tmdbVoteAverage).toBeNull();
    });
  });

  describe("parseYearFromReleaseDate", () => {
    it("returns null when the date has no four-digit year prefix", () => {
      expect(TmdbCatalogMapper.parseYearFromReleaseDate("tba")).toBeNull();
    });
  });
});
