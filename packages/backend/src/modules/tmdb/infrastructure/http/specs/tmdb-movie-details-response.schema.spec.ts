import { describe, it, expect } from "vitest";
import { TmdbMovieDetailsResponseSchema } from "@/modules/tmdb/infrastructure/http/tmdb-movie-details-response.schema";

describe("TmdbMovieDetailsResponseSchema", () => {
  it("strips extra keys from details payload", () => {
    const parsed = TmdbMovieDetailsResponseSchema.parse({
      id: 11,
      title: "Star Wars",
      overview: "",
      poster_path: null,
      release_date: "1977-05-25",
      budget: 11000000,
      credits: {
        cast: [{ name: "Mark Hamill", character: "Luke" }],
        crew: [{ name: "George Lucas", job: "Director", department: "Directing" }],
      },
      "watch/providers": {
        results: {
          BR: {
            flatrate: [
              { provider_name: "Disney Plus", logo_path: "/d.png", provider_id: 337 },
            ],
          },
          US: { flatrate: [{ provider_name: "Hulu", logo_path: "/h.png" }] },
        },
      },
      external_ids: { imdb_id: "tt0076759", facebook_id: "StarWars" },
    });

    expect(parsed).toEqual({
      id: 11,
      title: "Star Wars",
      overview: "",
      poster_path: null,
      release_date: "1977-05-25",
      credits: {
        cast: [{ name: "Mark Hamill" }],
        crew: [{ name: "George Lucas", job: "Director" }],
      },
      "watch/providers": {
        results: {
          BR: {
            flatrate: [
              { provider_name: "Disney Plus", logo_path: "/d.png" },
            ],
          },
        },
      },
      external_ids: { imdb_id: "tt0076759" },
    });
  });
});
