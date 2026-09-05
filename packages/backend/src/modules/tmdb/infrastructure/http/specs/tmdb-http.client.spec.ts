import { describe, it, expect, vi } from "vitest";
import { TmdbHttpClient } from "@/modules/tmdb/infrastructure/http/tmdb-http.client";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";

const SEARCH_FIXTURE = {
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
};

const SEARCH_PAGE_DTO = {
  page: 1,
  results: [
    {
      id: 1,
      title: "X",
      year: 2020,
      posterPath: null,
      overview: "",
    },
  ],
};

const EMPTY_SEARCH_PAYLOAD = { page: 1, results: [] };
const EMPTY_SEARCH_DTO = { page: 1, results: [] };

const DETAILS_FIXTURE = {
  id: 11,
  title: "Star Wars",
  overview: "",
  poster_path: null,
  release_date: "1977-05-25",
};

const DETAILS_DTO = {
  tmdbId: 11,
  title: "Star Wars",
  year: 1977,
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

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

function abortError(): Error {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
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

describe("TmdbHttpClient", () => {
  describe("getMovieDetails", () => {
    it("REQ-1: GET /movie/:id with language, append_to_response, watch_region and Bearer token", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, DETAILS_FIXTURE));
      const { client } = createClient(fetchFn);

      const result = await client.getMovieDetails(11);

      expect(result).toEqual(DETAILS_DTO);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      const [url, init] = fetchFn.mock.calls[0] as [
        string,
        RequestInit,
      ];
      const parsedUrl = new URL(url);

      expect(parsedUrl.origin + parsedUrl.pathname).toBe(
        "https://api.themoviedb.org/3/movie/11",
      );
      expect(parsedUrl.searchParams.get("language")).toBe("pt-BR");
      expect(parsedUrl.searchParams.get("append_to_response")).toBe(
        "credits,watch/providers,external_ids",
      );
      expect(parsedUrl.searchParams.get("watch_region")).toBe("BR");
      expect(init.method).toBe("GET");
      expect(init.headers).toEqual({
        Authorization: "Bearer test-token",
      });
    });

    it("envia language explícito no GET de details", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, DETAILS_FIXTURE));
      const { client } = createClient(fetchFn);

      await client.getMovieDetails(11, "en-US");

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get("language")).toBe("en-US");
    });

    it("REQ-2: retries 429 twice with backoff 1000 then 2000 and returns 200 JSON", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(429, { status_code: 25 }))
        .mockResolvedValueOnce(jsonResponse(429, { status_code: 25 }))
        .mockResolvedValueOnce(jsonResponse(200, DETAILS_FIXTURE));
      const { client, delay } = createClient(fetchFn);

      const result = await client.getMovieDetails(11);

      expect(result).toEqual(DETAILS_DTO);
      expect(fetchFn).toHaveBeenCalledTimes(3);
      expect(delay).toHaveBeenCalledTimes(2);
      expect(delay).toHaveBeenNthCalledWith(1, 1000);
      expect(delay).toHaveBeenNthCalledWith(2, 2000);
    });

    it("REQ-3: maps 401 to 502 without retry", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(401, {}));
      const { client, delay } = createClient(fetchFn);

      await expect(client.getMovieDetails(11)).rejects.toMatchObject({
        constructor: TmdbHttpException,
        statusCode: 502,
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(delay).not.toHaveBeenCalled();
    });

    it("REQ-4: AbortError after 3 attempts throws TmdbHttpException 504", async () => {
      const fetchFn = vi.fn().mockRejectedValue(abortError());
      const { client, delay } = createClient(fetchFn);

      await expect(client.getMovieDetails(11)).rejects.toMatchObject({
        constructor: TmdbHttpException,
        statusCode: 504,
      });
      expect(fetchFn).toHaveBeenCalledTimes(3);
      expect(delay).toHaveBeenCalledTimes(2);
    });
  });

  describe("edges", () => {
    it("throws 500 before fetch when accessToken is empty", async () => {
      const fetchFn = vi.fn();
      const delay = vi.fn().mockResolvedValue(undefined);
      const client = new TmdbHttpClient({
        fetch: fetchFn,
        accessToken: "",
        delay,
      });

      await expect(client.getMovieDetails(11)).rejects.toMatchObject({
        constructor: TmdbHttpException,
        statusCode: 500,
      });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("maps 404 to 404 without retry", async () => {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(404, {}));
      const { client, delay } = createClient(fetchFn);

      await expect(client.getMovieDetails(11)).rejects.toMatchObject({
        constructor: TmdbHttpException,
        statusCode: 404,
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(delay).not.toHaveBeenCalled();
    });

    it("maps persistent 5xx to 503 after 3 attempts", async () => {
      const fetchFn = vi.fn().mockImplementation(() =>
        Promise.resolve(jsonResponse(503, {})),
      );
      const { client, delay } = createClient(fetchFn);

      await expect(client.getMovieDetails(11)).rejects.toMatchObject({
        constructor: TmdbHttpException,
        statusCode: 503,
      });
      expect(fetchFn).toHaveBeenCalledTimes(3);
      expect(delay).toHaveBeenCalledTimes(2);
    });

    it.each([400, 422])(
      "maps %s to 502 without retry",
      async (status) => {
        const fetchFn = vi.fn().mockResolvedValue(jsonResponse(status, {}));
        const { client, delay } = createClient(fetchFn);

        await expect(client.getMovieDetails(11)).rejects.toMatchObject({
          constructor: TmdbHttpException,
          statusCode: 502,
        });
        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(delay).not.toHaveBeenCalled();
      },
    );

    it("maps 200 with invalid JSON to 502", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValue(new Response("not-json", { status: 200 }));
      const { client } = createClient(fetchFn);

      await expect(client.getMovieDetails(11)).rejects.toMatchObject({
        constructor: TmdbHttpException,
        statusCode: 502,
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("maps 200 with unexpected JSON shape to TmdbHttpException 502", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValue(jsonResponse(200, { not: "search" }));
      const { client } = createClient(fetchFn);

      await expect(client.searchMovies("matrix")).rejects.toMatchObject({
        constructor: TmdbHttpException,
        statusCode: 502,
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("searchMovies", () => {
    it("sends query, default page 1 and language pt-BR", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValue(jsonResponse(200, SEARCH_FIXTURE));
      const { client } = createClient(fetchFn);

      const result = await client.searchMovies("matrix");

      expect(result).toEqual(SEARCH_PAGE_DTO);
      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);

      expect(parsedUrl.origin + parsedUrl.pathname).toBe(
        "https://api.themoviedb.org/3/search/movie",
      );
      expect(parsedUrl.searchParams.get("query")).toBe("matrix");
      expect(parsedUrl.searchParams.get("page")).toBe("1");
      expect(parsedUrl.searchParams.get("language")).toBe("pt-BR");
      expect(parsedUrl.searchParams.get("primary_release_year")).toBeNull();
    });

    it("sends primary_release_year without appending year to the query text", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValue(jsonResponse(200, SEARCH_FIXTURE));
      const { client } = createClient(fetchFn);

      await client.searchMovies("The Name of the Rose", 1, 1986);

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get("query")).toBe("The Name of the Rose");
      expect(parsedUrl.searchParams.get("page")).toBe("1");
      expect(parsedUrl.searchParams.get("primary_release_year")).toBe("1986");
    });

    it("envia language explícito no GET de search", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValue(jsonResponse(200, SEARCH_FIXTURE));
      const { client } = createClient(fetchFn);

      await client.searchMovies("Interstellar", 1, undefined, "en-US");

      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get("language")).toBe("en-US");
    });

    it("sends the given page when provided", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValue(jsonResponse(200, EMPTY_SEARCH_PAYLOAD));
      const { client } = createClient(fetchFn);

      const result = await client.searchMovies("matrix", 3);

      expect(result).toEqual(EMPTY_SEARCH_DTO);
      const [url] = fetchFn.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get("page")).toBe("3");
    });
  });
});
