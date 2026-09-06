import { describe, expect, it } from "vitest";
import { TmdbPosterUtils } from "../tmdb-poster.utils";

describe("TmdbPosterUtils", () => {
  it("monta URL completa a partir do path relativo do TMDB", () => {
    const posterPath = "/poster.jpg";

    const posterUrl = TmdbPosterUtils.buildPosterUrl(posterPath);

    expect(posterUrl).toBe("https://image.tmdb.org/t/p/w500/poster.jpg");
  });

  it("aceita tamanho customizado", () => {
    const posterPath = "/poster.jpg";

    const posterUrl = TmdbPosterUtils.buildPosterUrl(posterPath, "w200");

    expect(posterUrl).toBe("https://image.tmdb.org/t/p/w200/poster.jpg");
  });

  it("retorna null quando path é nulo ou vazio", () => {
    expect(TmdbPosterUtils.buildPosterUrl(null)).toBeNull();
    expect(TmdbPosterUtils.buildPosterUrl("")).toBeNull();
  });
});
