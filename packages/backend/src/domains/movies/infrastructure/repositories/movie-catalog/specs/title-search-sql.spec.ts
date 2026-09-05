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
});
