import { describe, expect, it } from "vitest";
import {
  MovieCatalogSearchConstants,
  MovieCatalogSearchValidationException,
} from "../movie-catalog-search.constants";

describe("MovieCatalogSearchConstants", () => {
  it("expõe idiomas permitidos en-US e pt-BR", () => {
    expect(MovieCatalogSearchConstants.ALLOWED_LANGUAGES).toEqual([
      "en-US",
      "pt-BR",
    ]);
  });

  it("expõe en-US como idioma padrão", () => {
    expect(MovieCatalogSearchConstants.DEFAULT_LANGUAGE).toBe("en-US");
  });

  describe("resolveLanguage", () => {
    it("resolve idioma ausente para en-US", () => {
      expect(MovieCatalogSearchConstants.resolveLanguage(undefined)).toBe(
        "en-US",
      );
    });

    it("resolve string vazia para en-US", () => {
      expect(MovieCatalogSearchConstants.resolveLanguage("")).toBe("en-US");
    });

    it("resolve string só com espaços para en-US", () => {
      expect(MovieCatalogSearchConstants.resolveLanguage("   ")).toBe("en-US");
    });

    it("remove espaços ao redor do idioma permitido", () => {
      expect(MovieCatalogSearchConstants.resolveLanguage(" pt-BR ")).toBe(
        "pt-BR",
      );
    });

    it.each(["en-US", "pt-BR"])("mantém o idioma permitido %s", (language) => {
      expect(MovieCatalogSearchConstants.resolveLanguage(language)).toBe(
        language,
      );
    });

    it("rejeita idioma fora da lista com exceção de statusCode 400", () => {
      expect.assertions(2);

      try {
        MovieCatalogSearchConstants.resolveLanguage("fr-FR");
      } catch (error) {
        expect(error).toBeInstanceOf(MovieCatalogSearchValidationException);
        expect((error as MovieCatalogSearchValidationException).statusCode).toBe(
          400,
        );
      }
    });
  });
});
