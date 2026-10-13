import { describe, expect, it } from "vitest";
import {
  MovieCatalogDiscoverQuerySchema,
  MovieCatalogKeywordsQuerySchema,
  MovieCatalogPeopleQuerySchema,
  MovieCatalogSearchQuerySchema,
  MovieKeywordSearchPageResponseSchema,
  MoviePersonSearchPageResponseSchema,
  MovieSearchPageResponseSchema,
} from "../movie-catalog-search.dto";

describe("MovieCatalogSearchQuerySchema", () => {
  it("faz coerce de page e year para número", () => {
    const parsed = MovieCatalogSearchQuerySchema.parse({
      query: "Interstellar",
      page: "1",
      year: "2014",
      language: "pt-BR",
    });

    expect(parsed).toEqual({
      query: "Interstellar",
      page: 1,
      year: 2014,
      language: "pt-BR",
    });
  });

  it("aceita query vazia e campos ausentes", () => {
    const parsed = MovieCatalogSearchQuerySchema.parse({});

    expect(parsed.query).toBeUndefined();
    expect(parsed.page).toBeUndefined();
    expect(parsed.year).toBeUndefined();
    expect(parsed.language).toBeUndefined();
  });

  it("aceita query só com espaços (o use case decide o discover)", () => {
    const parsed = MovieCatalogSearchQuerySchema.parse({ query: "   " });

    expect(parsed.query).toBe("   ");
  });

  it.each(["fr-FR", "en", "pt-BR "])(
    "rejeita idioma fora do enum %s",
    (language) => {
      expect(
        MovieCatalogSearchQuerySchema.safeParse({ language }).success,
      ).toBe(false);
    },
  );

  it.each(["0", "-1", "1.5", "abc"])(
    "rejeita page inválida %s",
    (page) => {
      expect(MovieCatalogSearchQuerySchema.safeParse({ page }).success).toBe(
        false,
      );
    },
  );

  it.each(["0", "-5", "2014.5", "abc"])(
    "rejeita year inválido %s",
    (year) => {
      expect(MovieCatalogSearchQuerySchema.safeParse({ year }).success).toBe(
        false,
      );
    },
  );

  it("REQ-5: rejeita filtro de discover na busca por texto", () => {
    expect(
      MovieCatalogSearchQuerySchema.safeParse({ query: "X", genres: "28" })
        .success,
    ).toBe(false);
  });
});

describe("MovieCatalogPeopleQuerySchema", () => {
  it("exige query não vazia e faz trim", () => {
    const parsed = MovieCatalogPeopleQuerySchema.parse({ query: "  Nolan  " });

    expect(parsed.query).toBe("Nolan");
  });

  it.each([{}, { query: "" }, { query: "   " }])(
    "rejeita query ausente ou em branco %j",
    (input) => {
      expect(MovieCatalogPeopleQuerySchema.safeParse(input).success).toBe(false);
    },
  );

  it("faz coerce de page e aceita language permitido", () => {
    const parsed = MovieCatalogPeopleQuerySchema.parse({
      query: "Nolan",
      page: "2",
      language: "pt-BR",
    });

    expect(parsed).toEqual({ query: "Nolan", page: 2, language: "pt-BR" });
  });
});

describe("MovieCatalogKeywordsQuerySchema", () => {
  it("exige query não vazia, faz trim e coerce de page", () => {
    const parsed = MovieCatalogKeywordsQuerySchema.parse({
      query: "  time travel  ",
      page: "3",
    });

    expect(parsed).toEqual({ query: "time travel", page: 3 });
  });

  it.each([{}, { query: "" }, { query: "   " }])(
    "rejeita query ausente ou em branco %j",
    (input) => {
      expect(MovieCatalogKeywordsQuerySchema.safeParse(input).success).toBe(
        false,
      );
    },
  );
});

describe("MovieCatalogDiscoverQuerySchema", () => {
  it("converte lista de ids separada por vírgula", () => {
    const parsed = MovieCatalogDiscoverQuerySchema.parse({
      genres: "28,35",
      cast: "234352,6193",
      director: "525",
      keyword: "4379",
    });

    expect(parsed.genres).toEqual([28, 35]);
    expect(parsed.cast).toEqual([234352, 6193]);
    expect(parsed.director).toEqual([525]);
    expect(parsed.keyword).toEqual([4379]);
  });

  it("tolera espaços e segmentos vazios na lista em vírgula", () => {
    const parsed = MovieCatalogDiscoverQuerySchema.parse({
      genres: " 28 ,, 35 ",
    });

    expect(parsed.genres).toEqual([28, 35]);
  });

  it("trata lista vazia como ausente", () => {
    const empty = MovieCatalogDiscoverQuerySchema.parse({ genres: "" });
    const onlyCommas = MovieCatalogDiscoverQuerySchema.parse({ genres: ",," });

    expect(empty.genres).toBeUndefined();
    expect(onlyCommas.genres).toBeUndefined();
  });

  it("aceita lista já em array (repetição da query string)", () => {
    const parsed = MovieCatalogDiscoverQuerySchema.parse({
      genres: ["28", "35"],
      cast: [234352, 6193],
    });

    expect(parsed.genres).toEqual([28, 35]);
    expect(parsed.cast).toEqual([234352, 6193]);
  });

  it.each(["0", "-1", "1.5", "abc", "28,abc"])(
    "rejeita id inválido na lista %s",
    (genres) => {
      expect(
        MovieCatalogDiscoverQuerySchema.safeParse({ genres }).success,
      ).toBe(false);
    },
  );

  it("faz coerce dos filtros numéricos e mantém strings de certificação", () => {
    const parsed = MovieCatalogDiscoverQuerySchema.parse({
      minRating: "7",
      yearFrom: "2010",
      yearTo: "2015",
      runtimeFrom: "90",
      runtimeTo: "140",
      certificationCountry: "BR",
      certification: "14",
      page: "2",
      language: "pt-BR",
    });

    expect(parsed).toEqual({
      minRating: 7,
      yearFrom: 2010,
      yearTo: 2015,
      runtimeFrom: 90,
      runtimeTo: 140,
      certificationCountry: "BR",
      certification: "14",
      page: 2,
      language: "pt-BR",
    });
  });

  it("aceita discover sem filtros", () => {
    const parsed = MovieCatalogDiscoverQuerySchema.parse({});

    expect(parsed).toEqual({});
  });

  it("REQ-5: rejeita busca por texto no discover", () => {
    expect(
      MovieCatalogDiscoverQuerySchema.safeParse({ query: "Interstellar" })
        .success,
    ).toBe(false);
  });
});

describe("schemas de resposta", () => {
  it("valida uma MovieSearchPage de resposta", () => {
    const parsed = MovieSearchPageResponseSchema.parse({
      page: 1,
      results: [
        {
          id: 1,
          title: "Interstellar",
          year: 2014,
          posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
          overview: "Space",
          voteAverage: null,
        },
      ],
    });

    expect(parsed.results[0]?.id).toBe(1);
  });

  it("valida uma MoviePersonSearchPage de resposta", () => {
    const parsed = MoviePersonSearchPageResponseSchema.parse({
      page: 1,
      results: [
        {
          id: 525,
          name: "Christopher Nolan",
          knownForDepartment: "Directing",
          knownFor: [{ id: 27205, title: "Inception" }],
        },
      ],
    });

    expect(parsed.results[0]?.knownForDepartment).toBe("Directing");
  });

  it("valida uma MovieKeywordSearchPage de resposta", () => {
    const parsed = MovieKeywordSearchPageResponseSchema.parse({
      page: 1,
      results: [{ id: 4379, name: "time travel" }],
    });

    expect(parsed.results[0]).toEqual({ id: 4379, name: "time travel" });
  });
});
