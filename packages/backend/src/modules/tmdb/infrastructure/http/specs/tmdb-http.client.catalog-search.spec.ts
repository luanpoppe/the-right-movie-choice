import { describe, expect, it, vi } from "vitest";
import { TmdbHttpClient } from "@/modules/tmdb/infrastructure/http/tmdb-http.client";

const SEARCH_FIXTURE = {
  page: 2,
  results: [
    {
      id: 12,
      title: "Finding Nemo",
      overview: "Fish",
      poster_path: "/nemo.jpg",
      release_date: "2003-05-30",
    },
  ],
};

const SEARCH_DTO = {
  page: 2,
  results: [
    {
      id: 12,
      title: "Finding Nemo",
      year: 2003,
      posterPath: "/nemo.jpg",
      overview: "Fish",
    },
  ],
};

const PERSON_FIXTURE = {
  page: 1,
  results: [
    {
      id: 525,
      name: "Christopher Nolan",
      known_for_department: "Directing",
      known_for: [
        { id: 27205, title: "Inception" },
        { id: 155, name: "The Dark Knight" },
        { id: 999 },
      ],
    },
    {
      id: 600,
      name: "Someone",
      known_for: [],
    },
  ],
};

const KEYWORD_FIXTURE = {
  page: 1,
  results: [
    { id: 4379, name: "time travel" },
    { id: 123, name: "time loop" },
  ],
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

function createClient(fetchFn: ReturnType<typeof vi.fn>) {
  const delay = vi.fn().mockResolvedValue(undefined);
  const client = new TmdbHttpClient({
    fetch: fetchFn,
    accessToken: "test-token",
    delay,
  });

  return { client, delay };
}

describe("TmdbHttpClient (catalog search)", () => {
  describe("searchMovies", () => {
    it("REQ-1: GET /search/movie com query, page, year, language e include_adult=false", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, SEARCH_FIXTURE));
      const { client } = createClient(fetchFn);

      const result = await client.searchMovies("Interstellar", 1, 2014, "en-US");

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.origin + parsedUrl.pathname).toBe(
        "https://api.themoviedb.org/3/search/movie",
      );
      expect(parsedUrl.searchParams.get("query")).toBe("Interstellar");
      expect(parsedUrl.searchParams.get("page")).toBe("1");
      expect(parsedUrl.searchParams.get("primary_release_year")).toBe("2014");
      expect(parsedUrl.searchParams.get("language")).toBe("en-US");
      expect(parsedUrl.searchParams.get("include_adult")).toBe("false");
      expect(result).toEqual(SEARCH_DTO);
    });
  });

  describe("searchPeople", () => {
    it("REQ-7: GET /search/person com query, page, language e include_adult=false", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, PERSON_FIXTURE));
      const { client } = createClient(fetchFn);

      const result = await client.searchPeople("Nolan", 2, "en-US");

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.origin + parsedUrl.pathname).toBe(
        "https://api.themoviedb.org/3/search/person",
      );
      expect(parsedUrl.searchParams.get("query")).toBe("Nolan");
      expect(parsedUrl.searchParams.get("page")).toBe("2");
      expect(parsedUrl.searchParams.get("language")).toBe("en-US");
      expect(parsedUrl.searchParams.get("include_adult")).toBe("false");
      expect(result.page).toBe(1);
    });

    it("REQ-7: mapeia known_for_department e os títulos de known_for", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, PERSON_FIXTURE));
      const { client } = createClient(fetchFn);

      const result = await client.searchPeople("Nolan", 1, "en-US");

      expect(result.results[0]).toEqual({
        id: 525,
        name: "Christopher Nolan",
        knownForDepartment: "Directing",
        knownFor: [
          { id: 27205, title: "Inception" },
          { id: 155, title: "The Dark Knight" },
        ],
      });
    });

    it("REQ-7: usa null quando known_for_department está ausente", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, PERSON_FIXTURE));
      const { client } = createClient(fetchFn);

      const result = await client.searchPeople("Someone", 1, "en-US");

      expect(result.results[1]?.knownForDepartment).toBeNull();
    });

    it("usa page 1 e language pt-BR por padrão no client", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, PERSON_FIXTURE));
      const { client } = createClient(fetchFn);

      await client.searchPeople("Nolan");

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get("page")).toBe("1");
      expect(parsedUrl.searchParams.get("language")).toBe("pt-BR");
    });
  });

  describe("searchKeywords", () => {
    it("REQ-7: GET /search/keyword com query e page, sem language", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, KEYWORD_FIXTURE));
      const { client } = createClient(fetchFn);

      const result = await client.searchKeywords("time travel", 3);

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.origin + parsedUrl.pathname).toBe(
        "https://api.themoviedb.org/3/search/keyword",
      );
      expect(parsedUrl.searchParams.get("query")).toBe("time travel");
      expect(parsedUrl.searchParams.get("page")).toBe("3");
      expect(parsedUrl.searchParams.get("language")).toBeNull();
      expect(result).toEqual({
        page: 1,
        results: [
          { id: 4379, name: "time travel" },
          { id: 123, name: "time loop" },
        ],
      });
    });

    it("REQ-7: usa page 1 por padrão", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, KEYWORD_FIXTURE));
      const { client } = createClient(fetchFn);

      await client.searchKeywords("time travel");

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get("page")).toBe("1");
    });
  });

  describe("discoverMovies", () => {
    it("REQ-3: envia gêneros em ou, nota, faixa de anos, sort_by e include_adult=false", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, SEARCH_FIXTURE));
      const { client } = createClient(fetchFn);

      const result = await client.discoverMovies({
        genres: [28, 35],
        minRating: 7,
        yearFrom: 2010,
        yearTo: 2015,
        page: 2,
        language: "pt-BR",
      });

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.origin + parsedUrl.pathname).toBe(
        "https://api.themoviedb.org/3/discover/movie",
      );
      expect(parsedUrl.searchParams.get("with_genres")).toBe("28|35");
      expect(parsedUrl.searchParams.get("vote_average.gte")).toBe("7");
      expect(parsedUrl.searchParams.get("primary_release_date.gte")).toBe(
        "2010-01-01",
      );
      expect(parsedUrl.searchParams.get("primary_release_date.lte")).toBe(
        "2015-12-31",
      );
      expect(parsedUrl.searchParams.get("sort_by")).toBe("popularity.desc");
      expect(parsedUrl.searchParams.get("include_adult")).toBe("false");
      expect(parsedUrl.searchParams.get("page")).toBe("2");
      expect(parsedUrl.searchParams.get("language")).toBe("pt-BR");
      expect(result).toEqual(SEARCH_DTO);
    });

    it("REQ-8: envia elenco e direção como params separados e múltiplas keywords em ou", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, SEARCH_FIXTURE));
      const { client } = createClient(fetchFn);

      await client.discoverMovies({
        cast: [234352, 6193],
        director: [525],
        keyword: [4379, 123],
        runtimeFrom: 90,
        runtimeTo: 140,
        certificationCountry: "BR",
        certification: "14",
      });

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get("with_cast")).toBe("234352|6193");
      expect(parsedUrl.searchParams.get("with_crew")).toBe("525");
      expect(parsedUrl.searchParams.get("with_keywords")).toBe("4379|123");
      expect(parsedUrl.searchParams.get("with_runtime.gte")).toBe("90");
      expect(parsedUrl.searchParams.get("with_runtime.lte")).toBe("140");
      expect(parsedUrl.searchParams.get("certification_country")).toBe("BR");
      expect(parsedUrl.searchParams.get("certification")).toBe("14");
    });

    it("REQ-4: discover sem filtros mantém sort_by popularity.desc e a página padrão", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, SEARCH_FIXTURE));
      const { client } = createClient(fetchFn);

      await client.discoverMovies({});

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get("page")).toBe("1");
      expect(parsedUrl.searchParams.get("sort_by")).toBe("popularity.desc");
      expect(parsedUrl.searchParams.get("with_genres")).toBeNull();
      expect(parsedUrl.searchParams.get("vote_average.gte")).toBeNull();
      expect(parsedUrl.searchParams.get("with_cast")).toBeNull();
    });
  });
});
