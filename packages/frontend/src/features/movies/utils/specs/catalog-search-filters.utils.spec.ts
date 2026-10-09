import {
  CatalogSearchFiltersUtils,
  type CatalogSearchFilters,
} from "../catalog-search-filters.utils";

describe("CatalogSearchFiltersUtils.parse", () => {
  it("URL vazia retorna filtros vazios", () => {
    expect(CatalogSearchFiltersUtils.parse(new URLSearchParams())).toEqual({});
  });

  it("REQ-2: lê query", () => {
    const params = new URLSearchParams("query=Interstellar");

    expect(CatalogSearchFiltersUtils.parse(params).query).toBe("Interstellar");
  });

  it("edge: ignora query em branco", () => {
    const params = new URLSearchParams("query=%20%20");

    expect(CatalogSearchFiltersUtils.parse(params).query).toBeUndefined();
  });

  it("lê page numérica", () => {
    const params = new URLSearchParams("page=3");

    expect(CatalogSearchFiltersUtils.parse(params).page).toBe(3);
  });

  it("edge: descarta page não numérica", () => {
    const params = new URLSearchParams("page=abc");

    expect(CatalogSearchFiltersUtils.parse(params).page).toBeUndefined();
  });

  it("lê language suportado", () => {
    const params = new URLSearchParams("language=pt-BR");

    expect(CatalogSearchFiltersUtils.parse(params).language).toBe("pt-BR");
  });

  it("edge: descarta language não suportado", () => {
    const params = new URLSearchParams("language=fr-FR");

    expect(CatalogSearchFiltersUtils.parse(params).language).toBeUndefined();
  });

  it("REQ-3: lê lista de genres separada por vírgula", () => {
    const params = new URLSearchParams("genres=18,28");

    expect(CatalogSearchFiltersUtils.parse(params).genres).toEqual([18, 28]);
  });

  it("edge: aceita espaços na lista", () => {
    const params = new URLSearchParams("genres=18, 28,35");

    expect(CatalogSearchFiltersUtils.parse(params).genres).toEqual([18, 28, 35]);
  });

  it("edge: descarta tokens inválidos da lista e mantém válidos", () => {
    const params = new URLSearchParams("genres=18,abc,28");

    expect(CatalogSearchFiltersUtils.parse(params).genres).toEqual([18, 28]);
  });

  it("edge: lista só com inválidos retorna undefined", () => {
    const params = new URLSearchParams("genres=abc,def");

    expect(CatalogSearchFiltersUtils.parse(params).genres).toBeUndefined();
  });

  it("edge: lista com separadores vazios é normalizada", () => {
    const params = new URLSearchParams("genres=18,,28,");

    expect(CatalogSearchFiltersUtils.parse(params).genres).toEqual([18, 28]);
  });

  it("lê filtros escalares e de candidato", () => {
    const params = new URLSearchParams(
      "minRating=7&yearFrom=2010&yearTo=2015&runtimeFrom=60&runtimeTo=180&cast=1,2&director=525&keyword=100&certificationCountry=BR&certification=14",
    );

    const filters = CatalogSearchFiltersUtils.parse(params);

    expect(filters.minRating).toBe(7);
    expect(filters.yearFrom).toBe(2010);
    expect(filters.yearTo).toBe(2015);
    expect(filters.runtimeFrom).toBe(60);
    expect(filters.runtimeTo).toBe(180);
    expect(filters.cast).toEqual([1, 2]);
    expect(filters.director).toEqual([525]);
    expect(filters.keyword).toEqual([100]);
    expect(filters.certificationCountry).toBe("BR");
    expect(filters.certification).toBe("14");
  });
});

describe("CatalogSearchFiltersUtils.serialize", () => {
  it("omite campos ausentes", () => {
    const filters: CatalogSearchFilters = {};

    expect(CatalogSearchFiltersUtils.serialize(filters).toString()).toBe("");
  });

  it("omite listas vazias", () => {
    const filters: CatalogSearchFilters = { genres: [], cast: [] };

    expect(CatalogSearchFiltersUtils.serialize(filters).toString()).toBe("");
  });

  it("serializa listas separadas por vírgula", () => {
    const filters: CatalogSearchFilters = { genres: [18, 28] };

    const serialized = CatalogSearchFiltersUtils.serialize(filters);
    expect(serialized.get("genres")).toBe("18,28");
  });

  it("REQ-3: serializa o conjunto de filtros de discover", () => {
    const filters: CatalogSearchFilters = {
      genres: [18],
      minRating: 7,
      yearFrom: 2010,
      yearTo: 2015,
    };

    const serialized = CatalogSearchFiltersUtils.serialize(filters);

    expect(serialized.get("genres")).toBe("18");
    expect(serialized.get("minRating")).toBe("7");
    expect(serialized.get("yearFrom")).toBe("2010");
    expect(serialized.get("yearTo")).toBe("2015");
  });

  it("edge: round-trip preserva os filtros", () => {
    const filters: CatalogSearchFilters = {
      query: "Nolan",
      page: 2,
      language: "pt-BR",
      genres: [18, 28],
      minRating: 7.5,
      yearFrom: 2010,
      yearTo: 2015,
      cast: [1, 2],
      director: [525],
      keyword: [100],
      runtimeFrom: 60,
      runtimeTo: 180,
      certificationCountry: "BR",
      certification: "14",
    };

    const serialized = CatalogSearchFiltersUtils.serialize(filters);
    const parsed = CatalogSearchFiltersUtils.parse(serialized);

    expect(parsed).toEqual(filters);
  });
});

describe("CatalogSearchFiltersUtils.hasDiscoverFilters", () => {
  it("falso para filtros vazios", () => {
    expect(CatalogSearchFiltersUtils.hasDiscoverFilters({})).toBe(false);
  });

  it("REQ-1: page/language/query isolados não contam como discover", () => {
    const filters: CatalogSearchFilters = {
      query: "Interstellar",
      page: 2,
      language: "pt-BR",
    };

    expect(CatalogSearchFiltersUtils.hasDiscoverFilters(filters)).toBe(false);
  });

  it("falso para listas vazias", () => {
    const filters: CatalogSearchFilters = { genres: [], cast: [] };

    expect(CatalogSearchFiltersUtils.hasDiscoverFilters(filters)).toBe(false);
  });

  it("verdadeiro para lista com itens", () => {
    expect(
      CatalogSearchFiltersUtils.hasDiscoverFilters({ genres: [18] }),
    ).toBe(true);
  });

  it("verdadeiro para escalar de discover", () => {
    expect(
      CatalogSearchFiltersUtils.hasDiscoverFilters({ minRating: 7 }),
    ).toBe(true);
  });
});

describe("CatalogSearchFiltersUtils.resolveMode", () => {
  it("REQ-2: sem filtros de discover resolve search", () => {
    expect(CatalogSearchFiltersUtils.resolveMode({})).toBe("search");
  });

  it("REQ-1: query isolada resolve search", () => {
    expect(
      CatalogSearchFiltersUtils.resolveMode({ query: "Interstellar" }),
    ).toBe("search");
  });

  it("REQ-3: com filtros de discover resolve discover", () => {
    expect(
      CatalogSearchFiltersUtils.resolveMode({ genres: [18] }),
    ).toBe("discover");
  });
});
