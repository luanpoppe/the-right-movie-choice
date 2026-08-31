import { AxiosHeaders } from "axios";
import { GuestRemainingUtils } from "../guest-remaining.utils";

describe("GuestRemainingUtils.parseFromHeaders", () => {
  it("devolve null quando o header está ausente", () => {
    expect(GuestRemainingUtils.parseFromHeaders(undefined)).toBeNull();
    expect(GuestRemainingUtils.parseFromHeaders({})).toBeNull();
  });

  it("lê o header em minúsculas (Axios)", () => {
    const remaining = GuestRemainingUtils.parseFromHeaders({
      "x-guest-remaining": "0",
    });

    expect(remaining).toBe(0);
  });

  it("lê o header canônico X-Guest-Remaining", () => {
    const remaining = GuestRemainingUtils.parseFromHeaders({
      "X-Guest-Remaining": "1",
    });

    expect(remaining).toBe(1);
  });

  it("lê via AxiosHeaders.get (case-insensitive)", () => {
    const headers = new AxiosHeaders();
    headers.set("X-Guest-Remaining", "2");

    const remaining = GuestRemainingUtils.parseFromHeaders(headers);

    expect(remaining).toBe(2);
  });

  it("devolve null para valor inválido ou vazio", () => {
    expect(
      GuestRemainingUtils.parseFromHeaders({ "x-guest-remaining": "abc" }),
    ).toBeNull();
    expect(
      GuestRemainingUtils.parseFromHeaders({ "x-guest-remaining": "1.5" }),
    ).toBeNull();
    expect(
      GuestRemainingUtils.parseFromHeaders({ "x-guest-remaining": "" }),
    ).toBeNull();
  });
});
