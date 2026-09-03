import { describe, it, expect } from "vitest";
import { TmdbHttpClient } from "@/modules/tmdb/infrastructure/http/tmdb-http.client";
import { StringUtils } from "@/shared/utils/string.utils";

const tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN;
const shouldSkipLiveTests = StringUtils.isEmptyString(tmdbAccessToken);

describe.skipIf(shouldSkipLiveTests)("TmdbHttpClient live", () => {
  it(
    "searchMovies then getMovieDetails against TMDB",
    async () => {
      if (StringUtils.isEmptyString(tmdbAccessToken)) {
        return;
      }

      const client = new TmdbHttpClient({
        accessToken: tmdbAccessToken,
      });

      const searchPage = await client.searchMovies("The Matrix", 1);

      expect(typeof searchPage.page).toBe("number");
      expect(Array.isArray(searchPage.results)).toBe(true);

      const firstHit = searchPage.results[0];
      const movieId = firstHit?.id ?? 603;

      if (firstHit !== undefined) {
        expect(typeof firstHit.id).toBe("number");
        expect(typeof firstHit.title).toBe("string");
      }

      const details = await client.getMovieDetails(movieId);

      expect(typeof details.id).toBe("number");
      expect(typeof details.title).toBe("string");
      expect(details.watchProviders).toBeDefined();
      expect(Array.isArray(details.watchProviders.flatrate)).toBe(true);
      expect(Array.isArray(details.watchProviders.rent)).toBe(true);
      expect(Array.isArray(details.watchProviders.buy)).toBe(true);
      expect(Array.isArray(details.directors)).toBe(true);
      expect(Array.isArray(details.cast)).toBe(true);
    },
    30_000,
  );
});
