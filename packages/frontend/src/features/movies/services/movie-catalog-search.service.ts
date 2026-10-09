import { movieClient } from "@/lib/api/movie-client";
import {
  MovieCatalogDiscoverFilters,
  MovieCatalogLanguage,
  MovieKeywordSearchPage,
  MovieKeywordSearchPageSchema,
  MoviePersonSearchPage,
  MoviePersonSearchPageSchema,
  MovieSearchPage,
  MovieSearchPageSchema,
} from "../dto/movie-catalog-search.dto";

export class MovieCatalogSearchService {
  static async searchMovies(params: {
    query?: string;
    page?: number;
    year?: number;
    language?: MovieCatalogLanguage;
  }): Promise<MovieSearchPage> {
    const { data } = await movieClient.get("/movie/catalog/search", { params });
    const parsedResponse = MovieSearchPageSchema.parse(data);

    return parsedResponse;
  }

  static async discoverMovies(
    filters: MovieCatalogDiscoverFilters = {},
    page?: number,
    language?: MovieCatalogLanguage,
  ): Promise<MovieSearchPage> {
    const params = MovieCatalogSearchService.buildDiscoverParams(filters);

    if (page !== undefined) {
      params.page = page;
    }
    if (language !== undefined) {
      params.language = language;
    }

    const { data } = await movieClient.get("/movie/catalog/discover", {
      params,
    });
    const parsedResponse = MovieSearchPageSchema.parse(data);

    return parsedResponse;
  }

  static async searchPeople(params: {
    query: string;
    page?: number;
    language?: MovieCatalogLanguage;
  }): Promise<MoviePersonSearchPage> {
    const { data } = await movieClient.get("/movie/catalog/people", { params });
    const parsedResponse = MoviePersonSearchPageSchema.parse(data);

    return parsedResponse;
  }

  static async searchKeywords(params: {
    query: string;
    page?: number;
  }): Promise<MovieKeywordSearchPage> {
    const { data } = await movieClient.get("/movie/catalog/keywords", {
      params,
    });
    const parsedResponse = MovieKeywordSearchPageSchema.parse(data);

    return parsedResponse;
  }

  private static buildDiscoverParams(
    filters: MovieCatalogDiscoverFilters,
  ): Record<string, string | number> {
    const params: Record<string, string | number> = {};

    const genres = MovieCatalogSearchService.joinIdList(filters.genres);
    if (genres !== undefined) {
      params.genres = genres;
    }

    const cast = MovieCatalogSearchService.joinIdList(filters.cast);
    if (cast !== undefined) {
      params.cast = cast;
    }

    const director = MovieCatalogSearchService.joinIdList(filters.director);
    if (director !== undefined) {
      params.director = director;
    }

    const keyword = MovieCatalogSearchService.joinIdList(filters.keyword);
    if (keyword !== undefined) {
      params.keyword = keyword;
    }

    if (filters.minRating !== undefined) {
      params.minRating = filters.minRating;
    }
    if (filters.yearFrom !== undefined) {
      params.yearFrom = filters.yearFrom;
    }
    if (filters.yearTo !== undefined) {
      params.yearTo = filters.yearTo;
    }
    if (filters.runtimeFrom !== undefined) {
      params.runtimeFrom = filters.runtimeFrom;
    }
    if (filters.runtimeTo !== undefined) {
      params.runtimeTo = filters.runtimeTo;
    }
    if (filters.certificationCountry !== undefined) {
      params.certificationCountry = filters.certificationCountry;
    }
    if (filters.certification !== undefined) {
      params.certification = filters.certification;
    }

    return params;
  }

  private static joinIdList(ids?: number[]): string | undefined {
    const isEmpty = ids === undefined || ids.length === 0;
    if (isEmpty) {
      return undefined;
    }

    return ids.join(",");
  }
}
