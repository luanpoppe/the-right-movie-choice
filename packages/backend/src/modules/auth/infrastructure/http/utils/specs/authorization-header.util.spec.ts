import { describe, it, expect } from "vitest";
import { AuthorizationHeaderUtils } from "../authorization-header.util";

describe("AuthorizationHeaderUtils", () => {
  it("returns the token after Bearer", () => {
    expect(AuthorizationHeaderUtils.extractBearerToken("Bearer abc.def")).toBe(
      "abc.def",
    );
  });

  it("is case-insensitive on Bearer", () => {
    expect(AuthorizationHeaderUtils.extractBearerToken("bearer token")).toBe(
      "token",
    );
  });

  it("returns undefined when header is missing or not a string", () => {
    expect(
      AuthorizationHeaderUtils.extractBearerToken(undefined),
    ).toBeUndefined();
    expect(
      AuthorizationHeaderUtils.extractBearerToken(["Bearer a"]),
    ).toBeUndefined();
  });

  it("returns undefined when Bearer has no token", () => {
    expect(
      AuthorizationHeaderUtils.extractBearerToken("Bearer"),
    ).toBeUndefined();
    expect(
      AuthorizationHeaderUtils.extractBearerToken("Bearer "),
    ).toBeUndefined();
  });
});
