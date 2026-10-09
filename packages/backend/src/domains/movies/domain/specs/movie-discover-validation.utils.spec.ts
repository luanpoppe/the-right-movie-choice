import { describe, expect, it } from "vitest";
import { MovieCatalogSearchValidationException } from "../movie-catalog-search.constants";
import { MovieDiscoverValidationUtils } from "../movie-discover-validation.utils";

describe("MovieDiscoverValidationUtils", () => {
  describe("assertValidLanguage", () => {
    it("aceita idioma indefinido", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidLanguage(undefined),
      ).not.toThrow();
    });

    it.each(["en-US", "pt-BR"])("aceita o idioma permitido %s", (language) => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidLanguage(language),
      ).not.toThrow();
    });

    it("aceita idioma permitido com espaços ao redor", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidLanguage(" pt-BR "),
      ).not.toThrow();
    });

    it.each(["fr-FR", "EN-US", "es-ES"])(
      "rejeita o idioma não permitido %s",
      (language) => {
        expect(() =>
          MovieDiscoverValidationUtils.assertValidLanguage(language),
        ).toThrow(MovieCatalogSearchValidationException);
      },
    );

    it("rejeita idioma desconhecido com statusCode 400", () => {
      expect.assertions(2);

      try {
        MovieDiscoverValidationUtils.assertValidLanguage("de-DE");
      } catch (error) {
        expect(error).toBeInstanceOf(MovieCatalogSearchValidationException);
        expect((error as MovieCatalogSearchValidationException).statusCode).toBe(
          400,
        );
      }
    });
  });

  describe("assertValidPage", () => {
    it("aceita página indefinida", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidPage(undefined),
      ).not.toThrow();
    });

    it("aceita página inteira >= 1", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidPage(1),
      ).not.toThrow();
      expect(() =>
        MovieDiscoverValidationUtils.assertValidPage(500),
      ).not.toThrow();
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      "rejeita a página inválida %s",
      (page) => {
        expect(() =>
          MovieDiscoverValidationUtils.assertValidPage(page),
        ).toThrow(MovieCatalogSearchValidationException);
      },
    );
  });

  describe("assertValidMinRating", () => {
    it("aceita nota indefinida", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidMinRating(undefined),
      ).not.toThrow();
    });

    it("aceita nota nos limites 0 e 10", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidMinRating(0),
      ).not.toThrow();
      expect(() =>
        MovieDiscoverValidationUtils.assertValidMinRating(10),
      ).not.toThrow();
    });

    it.each([11, -1, 10.1, Number.NaN, Number.POSITIVE_INFINITY])(
      "rejeita a nota fora do intervalo %s",
      (minRating) => {
        expect(() =>
          MovieDiscoverValidationUtils.assertValidMinRating(minRating),
        ).toThrow(MovieCatalogSearchValidationException);
      },
    );

    it("expõe limites MIN_RATING 0 e MAX_RATING 10", () => {
      expect(MovieDiscoverValidationUtils.MIN_RATING).toBe(0);
      expect(MovieDiscoverValidationUtils.MAX_RATING).toBe(10);
    });
  });

  describe("assertValidYearRange", () => {
    it("aceita intervalo ausente", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidYearRange(undefined, undefined),
      ).not.toThrow();
    });

    it("aceita intervalo crescente", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidYearRange(2010, 2015),
      ).not.toThrow();
    });

    it("aceita apenas yearFrom", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidYearRange(2010, undefined),
      ).not.toThrow();
    });

    it("aceita apenas yearTo", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidYearRange(undefined, 2015),
      ).not.toThrow();
    });

    it("rejeita intervalo invertido 2015/2010", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidYearRange(2015, 2010),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it.each([
      [0, undefined],
      [-1, undefined],
      [2010.5, undefined],
      [undefined, 0],
      [undefined, -5],
    ])("rejeita ano não inteiro positivo from=%s to=%s", (yearFrom, yearTo) => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidYearRange(yearFrom, yearTo),
      ).toThrow(MovieCatalogSearchValidationException);
    });
  });

  describe("assertValidRuntimeRange", () => {
    it("aceita intervalo ausente", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidRuntimeRange(
          undefined,
          undefined,
        ),
      ).not.toThrow();
    });

    it("aceita intervalo 90 a 140", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidRuntimeRange(90, 140),
      ).not.toThrow();
    });

    it("rejeita intervalo invertido 140/90", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidRuntimeRange(140, 90),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it.each([
      [0, undefined],
      [-10, undefined],
      [90.5, undefined],
      [undefined, 0],
    ])(
      "rejeita duração não inteira positiva from=%s to=%s",
      (runtimeFrom, runtimeTo) => {
        expect(() =>
          MovieDiscoverValidationUtils.assertValidRuntimeRange(
            runtimeFrom,
            runtimeTo,
          ),
        ).toThrow(MovieCatalogSearchValidationException);
      },
    );
  });

  describe("assertValidCertification", () => {
    it("aceita país e certificação ausentes", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidCertification(
          undefined,
          undefined,
        ),
      ).not.toThrow();
    });

    it("aceita país e certificação juntos", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidCertification("BR", "14"),
      ).not.toThrow();
    });

    it("rejeita país sem certificação", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidCertification("BR", undefined),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita certificação sem país", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidCertification(undefined, "14"),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita país em string vazia com certificação presente", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidCertification("", "14"),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita certificação em string vazia com país presente", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidCertification("BR", ""),
      ).toThrow(MovieCatalogSearchValidationException);
    });
  });

  describe("assertValidIdList", () => {
    it("aceita lista indefinida", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidIdList(undefined, "genres"),
      ).not.toThrow();
    });

    it("aceita lista vazia", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidIdList([], "genres"),
      ).not.toThrow();
    });

    it("aceita lista de inteiros positivos", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidIdList([28, 35], "genres"),
      ).not.toThrow();
    });

    it.each([[[0]], [[-1]], [[1.5]], [[28, 0]], [[28, -3]]])(
      "rejeita id inválido na lista %j",
      (ids) => {
        expect(() =>
          MovieDiscoverValidationUtils.assertValidIdList(ids, "genres"),
        ).toThrow(MovieCatalogSearchValidationException);
      },
    );
  });

  describe("assertPositiveInteger", () => {
    it("aceita valor indefinido", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertPositiveInteger(undefined, "yearFrom"),
      ).not.toThrow();
    });

    it("aceita inteiro positivo", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertPositiveInteger(1, "yearFrom"),
      ).not.toThrow();
    });

    it.each([0, -1, 2.5, Number.NaN])(
      "rejeita valor inválido %s citando o campo",
      (value) => {
        expect(() =>
          MovieDiscoverValidationUtils.assertPositiveInteger(value, "yearFrom"),
        ).toThrow(/yearFrom/);
      },
    );
  });

  describe("assertValidQuery", () => {
    it("aceita query completa válida", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({
          page: 2,
          language: "pt-BR",
          genres: [28, 35],
          minRating: 7,
          yearFrom: 2010,
          yearTo: 2015,
          cast: [234352, 6193],
          director: [525],
          keyword: [4379],
          runtimeFrom: 90,
          runtimeTo: 140,
          certificationCountry: "BR",
          certification: "14",
        }),
      ).not.toThrow();
    });

    it("aceita query vazia", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({}),
      ).not.toThrow();
    });

    it("rejeita query com idioma inválido", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({ language: "fr-FR" }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com página inválida", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({ page: 0 }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com nota mínima acima de 10", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({ minRating: 11 }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com anos invertidos", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({
          yearFrom: 2015,
          yearTo: 2010,
        }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com duração invertida", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({
          runtimeFrom: 140,
          runtimeTo: 90,
        }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com certificação sem país", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({ certification: "14" }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com id de elenco inválido", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({ cast: [0] }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com id de diretor inválido", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({ director: [-1] }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com id de palavra-chave inválido", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({ keyword: [1.5] }),
      ).toThrow(MovieCatalogSearchValidationException);
    });

    it("rejeita query com id de gênero inválido", () => {
      expect(() =>
        MovieDiscoverValidationUtils.assertValidQuery({ genres: [0] }),
      ).toThrow(MovieCatalogSearchValidationException);
    });
  });
});
