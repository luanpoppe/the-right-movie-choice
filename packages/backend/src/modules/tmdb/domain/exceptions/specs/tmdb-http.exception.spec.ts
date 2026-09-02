import { describe, it, expect } from "vitest";
import { BaseException } from "@/core/exceptions/base.exception";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";

describe("TmdbHttpException", () => {
  it("extends BaseException and exposes statusCode", () => {
    const exception = new TmdbHttpException("TMDB request failed", 502);

    expect(exception).toBeInstanceOf(BaseException);
    expect(exception).toBeInstanceOf(Error);
    expect(exception.statusCode).toBe(502);
    expect(exception.message).toBe("TMDB request failed");
  });
});
