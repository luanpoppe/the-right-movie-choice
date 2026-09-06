import { describe, expect, it } from "vitest";
import { UserMovieEntryListOrderUtils } from "../user-movie-entry-list-order.utils";

describe("UserMovieEntryListOrderUtils", () => {
  it("REQ-9: filtro watched=true ordena por watchedAt desc com nulls por último", () => {
    const orderBy = UserMovieEntryListOrderUtils.buildOrderBy({ watched: true });

    expect(orderBy).toEqual({
      watchedAt: { sort: "desc", nulls: "last" },
    });
  });

  it("REQ-9: filtro favorite=true ordena por updatedAt desc", () => {
    const orderBy = UserMovieEntryListOrderUtils.buildOrderBy({ favorite: true });

    expect(orderBy).toEqual({ updatedAt: "desc" });
  });

  it("REQ-9: filtro inWatchlist=true ordena por updatedAt desc", () => {
    const orderBy = UserMovieEntryListOrderUtils.buildOrderBy({
      inWatchlist: true,
    });

    expect(orderBy).toEqual({ updatedAt: "desc" });
  });

  it("REQ-9: filtro vazio ordena por updatedAt desc", () => {
    const orderBy = UserMovieEntryListOrderUtils.buildOrderBy({});

    expect(orderBy).toEqual({ updatedAt: "desc" });
  });

  it("REQ-9: watched=false não usa ordenação por watchedAt", () => {
    const orderBy = UserMovieEntryListOrderUtils.buildOrderBy({ watched: false });

    expect(orderBy).toEqual({ updatedAt: "desc" });
  });

  it("REQ-9: watched=true com outros filtros mantém ordenação por watchedAt", () => {
    const orderBy = UserMovieEntryListOrderUtils.buildOrderBy({
      watched: true,
      favorite: true,
    });

    expect(orderBy).toEqual({
      watchedAt: { sort: "desc", nulls: "last" },
    });
  });
});
