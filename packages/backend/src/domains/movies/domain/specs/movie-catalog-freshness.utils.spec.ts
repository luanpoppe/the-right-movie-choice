import { describe, expect, it } from "vitest";
import { MovieCatalogFreshnessUtils } from "../movie-catalog-freshness.utils";

describe("MovieCatalogFreshnessUtils", () => {
  const freshForMs = MovieCatalogFreshnessUtils.FRESH_FOR_MS;

  it("considera fresh quando a idade é zero", () => {
    const updatedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date("2026-01-01T00:00:00.000Z");

    const isFresh = MovieCatalogFreshnessUtils.isFresh(updatedAt, now);

    expect(isFresh).toBe(true);
  });

  it("considera fresh quando a idade é menor que 30 dias", () => {
    const updatedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date(updatedAt.getTime() + freshForMs - 1);

    const isFresh = MovieCatalogFreshnessUtils.isFresh(updatedAt, now);

    expect(isFresh).toBe(true);
  });

  it("considera stale quando a idade é exatamente 30 dias", () => {
    const updatedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date(updatedAt.getTime() + freshForMs);

    const isFresh = MovieCatalogFreshnessUtils.isFresh(updatedAt, now);

    expect(isFresh).toBe(false);
  });

  it("considera stale quando a idade é maior que 30 dias", () => {
    const updatedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date(updatedAt.getTime() + freshForMs + 1);

    const isFresh = MovieCatalogFreshnessUtils.isFresh(updatedAt, now);

    expect(isFresh).toBe(false);
  });

  it("expõe janela de 30 dias em constantes", () => {
    expect(MovieCatalogFreshnessUtils.DAYS).toBe(30);
    expect(MovieCatalogFreshnessUtils.FRESH_FOR_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
