import type { MovieKeywordSearchPage } from "../../domain/entities/movie-keyword-search.entity";
import { MovieCatalogSearchValidationException } from "../../domain/movie-catalog-search.constants";
import type { IMovieCatalogProvider } from "../providers/movie-catalog.provider";

export type SearchCatalogKeywordsInput = {
  query: string;
  page?: number;
};

export class SearchCatalogKeywordsUseCase {
  constructor(private readonly catalog: IMovieCatalogProvider) {}

  async execute(
    input: SearchCatalogKeywordsInput,
  ): Promise<MovieKeywordSearchPage> {
    const rawQuery = input.query;
    const trimmedQuery = rawQuery.trim();

    const isEmptyQuery = trimmedQuery === "";
    if (isEmptyQuery) {
      const message = "Catalog keyword search requires a non-empty query.";
      throw new MovieCatalogSearchValidationException(message);
    }

    const page = input.page;

    const searchPage = await this.catalog.searchKeywords(trimmedQuery, page);

    return searchPage;
  }
}
