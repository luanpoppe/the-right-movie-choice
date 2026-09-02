import { describe, it, expect, vi } from "vitest";
import { MakeTmdbHttpClientFactory } from "@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory";
import { TmdbHttpClient } from "@/modules/tmdb/infrastructure/http/tmdb-http.client";

describe("MakeTmdbHttpClientFactory", () => {
  it("returns a TmdbHttpClient that implements searchMovies and getMovieDetails", () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    );
    const delay = vi.fn().mockResolvedValue(undefined);

    const client = MakeTmdbHttpClientFactory.create({
      fetch: fetchFn,
      accessToken: "test-token",
      delay,
    });

    expect(client).toBeInstanceOf(TmdbHttpClient);
    expect(typeof client.searchMovies).toBe("function");
    expect(typeof client.getMovieDetails).toBe("function");
  });
});
