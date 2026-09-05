import { describe, it, expect } from "vitest";
import { MovieCatalogTitleSearchSql } from "../title-search-sql";

describe("MovieCatalogTitleSearchSql", () => {
  it("monta padrão contains e escapa % e _ do texto do usuário", () => {
    const pattern = MovieCatalogTitleSearchSql.buildLikePattern("100%_lobo");

    expect(pattern).toBe("%100\\%\\_lobo%");
  });
});
