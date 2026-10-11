import { CandidateLabelCacheUtils } from "../candidate-label-cache.utils";

describe("CandidateLabelCacheUtils", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("M3: merge persiste rótulos e read devolve no mesmo kind", () => {
    const merged = CandidateLabelCacheUtils.merge("person", {
      525: "Christopher Nolan",
    });

    expect(merged).toEqual({ 525: "Christopher Nolan" });
    expect(CandidateLabelCacheUtils.read("person")).toEqual({
      525: "Christopher Nolan",
    });
  });

  it("M3: read de kind sem cache devolve objeto vazio", () => {
    expect(CandidateLabelCacheUtils.read("keyword")).toEqual({});
  });

  it("M3: merge acumula rótulos já existentes", () => {
    CandidateLabelCacheUtils.merge("keyword", { 100: "dream" });
    const merged = CandidateLabelCacheUtils.merge("keyword", { 200: "space" });

    expect(merged).toEqual({ 100: "dream", 200: "space" });
  });

  it("M3: kinds diferentes não compartilham cache", () => {
    CandidateLabelCacheUtils.merge("person", { 525: "Christopher Nolan" });

    expect(CandidateLabelCacheUtils.read("keyword")).toEqual({});
  });

  it("edge: JSON inválido no sessionStorage não quebra a leitura", () => {
    window.sessionStorage.setItem("catalog-candidate-labels:person", "{oops");

    expect(CandidateLabelCacheUtils.read("person")).toEqual({});
  });

  it("edge: valores não-string são descartados na leitura", () => {
    window.sessionStorage.setItem(
      "catalog-candidate-labels:person",
      JSON.stringify({ 525: "Christopher Nolan", 999: 123 }),
    );

    expect(CandidateLabelCacheUtils.read("person")).toEqual({
      525: "Christopher Nolan",
    });
  });
});
