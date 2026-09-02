import { describe, it, expect } from "vitest";
import { TmdbHttpConstants } from "@/modules/tmdb/domain/tmdb-http.constants";

describe("TmdbHttpConstants", () => {
  it("exposes timeout and retry defaults", () => {
    expect(TmdbHttpConstants.TIMEOUT_MS).toBe(5_000);
    expect(TmdbHttpConstants.MAX_RETRIES).toBe(2);
  });
});
