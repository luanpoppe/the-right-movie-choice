import { describe, it, expect } from "vitest";
import { TmdbCacheConstants } from "@/modules/tmdb/domain/tmdb-cache.constants";

describe("TmdbCacheConstants", () => {
  it("builds catalog key with default language pt-BR", () => {
    expect(TmdbCacheConstants.buildKey(11)).toBe("catalog:movie:11:pt-BR");
  });

  it("builds catalog key with explicit language", () => {
    expect(TmdbCacheConstants.buildKey(11, "en-US")).toBe(
      "catalog:movie:11:en-US",
    );
  });

  it("exposes 24h details TTL", () => {
    expect(TmdbCacheConstants.DETAILS_TTL_SECONDS).toBe(86_400);
  });
});
