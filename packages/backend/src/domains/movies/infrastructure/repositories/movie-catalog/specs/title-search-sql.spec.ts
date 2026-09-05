import { describe, it, expect } from "vitest";
import { MovieCatalogTitleSearchSql } from "../title-search-sql";

describe("MovieCatalogTitleSearchSql", () => {
  it("monta padrão contains e escapa % e _ do texto do usuário", () => {
    const pattern = MovieCatalogTitleSearchSql.buildLikePattern("100%_lobo");

    expect(pattern).toBe("%100\\%\\_lobo%");
  });

  it("edge empate: findIdQuery usa unaccent, ORDER BY updatedAt DESC e LIMIT 1", () => {
    const likePattern = MovieCatalogTitleSearchSql.buildLikePattern("interestelar");
    const query = MovieCatalogTitleSearchSql.buildFindIdQuery(
      "pt-BR",
      likePattern,
    );

    expect(query.sql).toContain("unaccent(title) ILIKE unaccent(");
    expect(query.sql).toContain('ORDER BY "updatedAt" DESC');
    expect(query.sql).toContain("LIMIT 1");
    expect(query.values).toContain("pt-BR");
    expect(query.values).toContain(likePattern);
  });

  it("findIdQuery inclui filtro de year quando informado", () => {
    const likePattern = MovieCatalogTitleSearchSql.buildLikePattern("duna");
    const query = MovieCatalogTitleSearchSql.buildFindIdQuery(
      "pt-BR",
      likePattern,
      2021,
    );

    expect(query.sql).toContain("AND year =");
    expect(query.values).toContain(2021);
  });

  it("batchFindIdsQuery usa ROW_NUMBER + VALUES e unaccent por item", () => {
    const pattern0 = MovieCatalogTitleSearchSql.buildLikePattern("interestelar");
    const pattern1 = MovieCatalogTitleSearchSql.buildLikePattern("duna");
    const query = MovieCatalogTitleSearchSql.buildBatchFindIdsQuery([
      { index: 0, catalogLanguage: "pt-BR", likePattern: pattern0 },
      { index: 1, catalogLanguage: "pt-BR", likePattern: pattern1 },
    ]);

    expect(query).not.toBeNull();
    expect(query!.sql).toContain("ROW_NUMBER()");
    expect(query!.sql).toContain("PARTITION BY q.idx");
    expect(query!.sql).toContain("ranked.rn = 1");
    expect(query!.sql).not.toContain("DISTINCT ON");
    expect(query!.sql).toContain("VALUES");
    expect(query!.sql).toContain("unaccent(m.title) ILIKE unaccent(");
    expect(query!.sql).toContain('ORDER BY m."updatedAt" DESC');
    expect(query!.values).toContain("pt-BR");
    expect(query!.values).toContain(pattern0);
    expect(query!.values).toContain(pattern1);
    expect(query!.values).toContain(0);
    expect(query!.values).toContain(1);
  });

  it("batchFindIdsQuery inclui filtro de year quando informado", () => {
    const likePattern = MovieCatalogTitleSearchSql.buildLikePattern("duna");
    const query = MovieCatalogTitleSearchSql.buildBatchFindIdsQuery([
      { index: 2, catalogLanguage: "pt-BR", likePattern: likePattern, year: 2021 },
    ]);

    expect(query).not.toBeNull();
    expect(query!.sql).toContain("q.year IS NULL OR m.year = q.year");
    expect(query!.values).toContain(2021);
    expect(query!.values).toContain(2);
  });

  it("batchFindIdsQuery preserva índices distintos em múltiplos itens", () => {
    const indices = [3, 7, 15];
    const items = indices.map((index) => {
      const title = `filme-${index}`;
      const likePattern = MovieCatalogTitleSearchSql.buildLikePattern(title);
      return { index, catalogLanguage: "en-US", likePattern };
    });
    const query = MovieCatalogTitleSearchSql.buildBatchFindIdsQuery(items);

    expect(query).not.toBeNull();
    expect(query!.values).toContain(3);
    expect(query!.values).toContain(7);
    expect(query!.values).toContain(15);
    expect(query!.values).toContain("en-US");
  });

  it("batchFindIdsQuery aceita catalogLanguage distinto por item", () => {
    const patternPt = MovieCatalogTitleSearchSql.buildLikePattern("interestelar");
    const patternEn = MovieCatalogTitleSearchSql.buildLikePattern("interstellar");
    const query = MovieCatalogTitleSearchSql.buildBatchFindIdsQuery([
      { index: 0, catalogLanguage: "pt-BR", likePattern: patternPt },
      { index: 1, catalogLanguage: "en-US", likePattern: patternEn },
    ]);

    expect(query).not.toBeNull();
    expect(query!.values).toContain("pt-BR");
    expect(query!.values).toContain("en-US");
  });

  it("batchFindIdsQuery retorna null quando items está vazio", () => {
    const query = MovieCatalogTitleSearchSql.buildBatchFindIdsQuery([]);

    expect(query).toBeNull();
  });
});
