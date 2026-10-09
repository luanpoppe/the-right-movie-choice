import type { CatalogSearchFilters } from "../catalog-search-filters.utils";
import { CatalogSearchFiltersValidationUtils } from "../catalog-search-filters-validation.utils";

function fieldNames(
  errors: Array<{ field: keyof CatalogSearchFilters }>,
): string[] {
  return errors.map((error) => String(error.field));
}

describe("CatalogSearchFiltersValidationUtils.validate", () => {
  it("filtros válidos passam sem erros", () => {
    const filters: CatalogSearchFilters = { page: 1, minRating: 7 };

    const result = CatalogSearchFiltersValidationUtils.validate(filters);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.normalized).toEqual(filters);
  });

  describe("REQ-5 edge: nota mínima", () => {
    it("nota acima de 10 gera erro e é normalizada", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        minRating: 12,
      });

      expect(result.valid).toBe(false);
      expect(fieldNames(result.errors)).toContain("minRating");
      expect(result.normalized.minRating).toBeUndefined();
    });

    it("nota abaixo de 0 gera erro e é normalizada", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        minRating: -1,
      });

      expect(result.valid).toBe(false);
      expect(result.normalized.minRating).toBeUndefined();
    });

    it("limites 0 e 10 são aceitos", () => {
      expect(
        CatalogSearchFiltersValidationUtils.validate({ minRating: 0 }).valid,
      ).toBe(true);
      expect(
        CatalogSearchFiltersValidationUtils.validate({ minRating: 10 }).valid,
      ).toBe(true);
    });
  });

  describe("edge: página", () => {
    it("page menor que 1 gera erro e normaliza para 1", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({ page: 0 });

      expect(result.valid).toBe(false);
      expect(fieldNames(result.errors)).toContain("page");
      expect(result.normalized.page).toBe(1);
    });
  });

  describe("edge: intervalo de anos invertido", () => {
    it("inverte yearFrom/yearTo e gera erro", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        yearFrom: 2020,
        yearTo: 2010,
      });

      expect(result.valid).toBe(false);
      expect(fieldNames(result.errors)).toContain("yearFrom");
      expect(result.normalized.yearFrom).toBe(2010);
      expect(result.normalized.yearTo).toBe(2020);
    });

    it("não valida quando só um dos lados existe", () => {
      expect(
        CatalogSearchFiltersValidationUtils.validate({ yearFrom: 2020 }).valid,
      ).toBe(true);
    });
  });

  describe("edge: intervalo de duração invertido", () => {
    it("inverte runtimeFrom/runtimeTo e gera erro", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        runtimeFrom: 200,
        runtimeTo: 60,
      });

      expect(result.valid).toBe(false);
      expect(fieldNames(result.errors)).toContain("runtimeFrom");
      expect(result.normalized.runtimeFrom).toBe(60);
      expect(result.normalized.runtimeTo).toBe(200);
    });

    it("não valida quando só um dos lados existe", () => {
      expect(
        CatalogSearchFiltersValidationUtils.validate({ runtimeFrom: 200 })
          .valid,
      ).toBe(true);
    });
  });

  describe("edge: certificação sem par", () => {
    it("país sem certificação gera erro e limpa ambos", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        certificationCountry: "BR",
      });

      expect(result.valid).toBe(false);
      expect(fieldNames(result.errors)).toContain("certificationCountry");
      expect(result.normalized.certificationCountry).toBeUndefined();
      expect(result.normalized.certification).toBeUndefined();
    });

    it("certificação sem país gera erro e limpa ambos", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        certification: "14",
      });

      expect(result.valid).toBe(false);
      expect(fieldNames(result.errors)).toContain("certification");
      expect(result.normalized.certificationCountry).toBeUndefined();
    });

    it("par completo é aceito", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        certificationCountry: "BR",
        certification: "14",
      });

      expect(result.valid).toBe(true);
    });
  });

  describe("edge: ids de candidato", () => {
    it("descarta ids não inteiros e mantém válidos", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        genres: [18, -1, 0, 1.5, 28],
      });

      expect(result.valid).toBe(false);
      expect(fieldNames(result.errors)).toContain("genres");
      expect(result.normalized.genres).toEqual([18, 28]);
    });

    it("remove a lista quando todos os ids são inválidos", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        cast: [0, -5, 2.2],
      });

      expect(result.valid).toBe(false);
      expect(result.normalized.cast).toBeUndefined();
    });

    it("lista válida não gera erro", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        director: [525, 1032],
      });

      expect(result.valid).toBe(true);
      expect(result.normalized.director).toEqual([525, 1032]);
    });
  });

  describe("edge: modo texto + discover", () => {
    it("combinação gera erro e remove a query", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        query: "Interstellar",
        minRating: 7,
      });

      expect(result.valid).toBe(false);
      expect(fieldNames(result.errors)).toContain("query");
      expect(result.normalized.query).toBeUndefined();
    });

    it("texto com page/language apenas continua válido", () => {
      const result = CatalogSearchFiltersValidationUtils.validate({
        query: "Interstellar",
        page: 2,
        language: "pt-BR",
      });

      expect(result.valid).toBe(true);
    });
  });

  it("acumula múltiplos erros no mesmo retorno", () => {
    const result = CatalogSearchFiltersValidationUtils.validate({
      minRating: 12,
      page: 0,
      yearFrom: 2020,
      yearTo: 2010,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
