import type { MoviePersonSearchPage } from "../../domain/entities/movie-person-search.entity";
import {
  MovieCatalogSearchConstants,
  MovieCatalogSearchValidationException,
} from "../../domain/movie-catalog-search.constants";
import type { IMovieCatalogProvider } from "../providers/movie-catalog.provider";

export type SearchCatalogPeopleInput = {
  query: string;
  page?: number;
  language?: string;
};

export class SearchCatalogPeopleUseCase {
  constructor(private readonly catalog: IMovieCatalogProvider) {}

  async execute(
    input: SearchCatalogPeopleInput,
  ): Promise<MoviePersonSearchPage> {
    const rawQuery = input.query;
    const trimmedQuery = rawQuery.trim();

    const isEmptyQuery = trimmedQuery === "";
    if (isEmptyQuery) {
      const message = "Catalog people search requires a non-empty query.";
      throw new MovieCatalogSearchValidationException(message);
    }

    const resolvedLanguage = MovieCatalogSearchConstants.resolveLanguage(
      input.language,
    );

    const page = input.page;

    const searchPage = await this.catalog.searchPeople(
      trimmedQuery,
      page,
      resolvedLanguage,
    );

    return searchPage;
  }
}
