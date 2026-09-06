import { TmdbPosterUtils } from "../tmdb-poster.utils";

describe("TmdbPosterUtils", () => {
  it("REQ-8: retorna URL absoluta https válida", () => {
    const posterUrl = "https://image.tmdb.org/t/p/w500/poster.jpg";

    expect(TmdbPosterUtils.resolvePosterUrl(posterUrl)).toBe(posterUrl);
  });

  it("REQ-8: retorna URL absoluta http válida", () => {
    const posterUrl = "http://image.tmdb.org/t/p/w500/poster.jpg";

    expect(TmdbPosterUtils.resolvePosterUrl(posterUrl)).toBe(posterUrl);
  });

  it("REQ-10: retorna null para caminho relativo do catálogo", () => {
    expect(TmdbPosterUtils.resolvePosterUrl("/poster.jpg")).toBeNull();
  });

  it("REQ-10: retorna null para posterPath null ou vazio", () => {
    expect(TmdbPosterUtils.resolvePosterUrl(null)).toBeNull();
    expect(TmdbPosterUtils.resolvePosterUrl("")).toBeNull();
    expect(TmdbPosterUtils.resolvePosterUrl(undefined)).toBeNull();
  });

  it("edge: retorna null para URL com protocolo inválido", () => {
    expect(TmdbPosterUtils.resolvePosterUrl("ftp://poster.jpg")).toBeNull();
  });
});
