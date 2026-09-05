import { describe, it, expect, vi } from "vitest";
import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type { MovieSearchPage } from "@/domains/movies/domain/entities/movie-search.entity";
import { MovieCatalogLookupTool } from "../../providers/movie-catalog-lookup.tool";
import { MakeMovieCatalogLookupToolFactory } from "../make-movie-catalog-lookup-tool.factory";

describe("MakeMovieCatalogLookupToolFactory", () => {
  it("cria MovieCatalogLookupTool com o catalog injetado", () => {
    const catalog: IMovieCatalogProvider = {
      searchMovies: vi.fn(),
      getMovieDetails: vi.fn(),
    };

    const tool = MakeMovieCatalogLookupToolFactory.create({ catalog });

    expect(tool).toBeInstanceOf(MovieCatalogLookupTool);
  });

  it("usa o catalog passado nos params ao executar lookup", async () => {
    const emptySearchPage: MovieSearchPage = { page: 1, results: [] };
    const catalog: IMovieCatalogProvider = {
      searchMovies: vi.fn().mockResolvedValue(emptySearchPage),
      getMovieDetails: vi.fn(),
    };
    const tool = MakeMovieCatalogLookupToolFactory.create({ catalog });

    await tool.lookup({ query: "Teste" });

    expect(catalog.searchMovies).toHaveBeenCalledWith("Teste");
  });
});
