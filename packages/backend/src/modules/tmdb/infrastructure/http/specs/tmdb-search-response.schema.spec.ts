import { describe, it, expect } from "vitest";
import { TmdbSearchResponseSchema } from "@/modules/tmdb/infrastructure/http/tmdb-search-response.schema";

describe("TmdbSearchResponseSchema", () => {
  it("strips extra keys from search payload", () => {
    const parsed = TmdbSearchResponseSchema.parse({
      page: 1,
      results: [
        {
          id: 1,
          title: "X",
          overview: "",
          poster_path: null,
          release_date: "2020-01-01",
          popularity: 99,
        },
      ],
      total_results: 1,
    });

    expect(parsed).toEqual({
      page: 1,
      results: [
        {
          id: 1,
          title: "X",
          overview: "",
          poster_path: null,
          release_date: "2020-01-01",
        },
      ],
    });
  });
});
