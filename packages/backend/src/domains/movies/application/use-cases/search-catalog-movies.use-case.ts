import { Logger } from "@/lib/logger/logger";
import type { MovieCatalogDetails } from "../../domain/entities/movie-catalog-details.entity";
import type { MovieDiscoverQuery } from "../../domain/entities/movie-discover-query.entity";
import type {
  MovieSearchHit,
  MovieSearchPage,
} from "../../domain/entities/movie-search.entity";
import { MovieCatalogSearchConstants } from "../../domain/movie-catalog-search.constants";
import type { IMovieCatalogProvider } from "../providers/movie-catalog.provider";

export type SearchCatalogMoviesInput = {
  query?: string;
  page?: number;
  year?: number;
  language?: string;
};

export class SearchCatalogMoviesUseCase {
  constructor(
    private readonly catalog: IMovieCatalogProvider,
    private readonly enqueuePersist: (
      details: MovieCatalogDetails,
      language: string,
    ) => Promise<void>,
  ) {}

  async execute(input: SearchCatalogMoviesInput): Promise<MovieSearchPage> {
    const resolvedLanguage = MovieCatalogSearchConstants.resolveLanguage(
      input.language,
    );

    const rawQuery = input.query ?? "";
    const trimmedQuery = rawQuery.trim();

    const page = input.page;
    const year = input.year;

    const isDiscoverMode = trimmedQuery === "";
    if (isDiscoverMode) {
      const discoverQuery = SearchCatalogMoviesUseCase.buildDiscoverQuery(
        page,
        resolvedLanguage,
      );
      const searchPage = await this.catalog.discoverMovies(discoverQuery);
      SearchCatalogMoviesUseCase.schedulePersistForHits(
        this.catalog,
        this.enqueuePersist,
        searchPage.results,
        resolvedLanguage,
      );
      return searchPage;
    }

    const searchPage = await this.catalog.searchMovies(
      trimmedQuery,
      page,
      year,
      resolvedLanguage,
    );
    SearchCatalogMoviesUseCase.schedulePersistForHits(
      this.catalog,
      this.enqueuePersist,
      searchPage.results,
      resolvedLanguage,
    );
    return searchPage;
  }

  private static buildDiscoverQuery(
    page: number | undefined,
    language: string,
  ): MovieDiscoverQuery {
    const discoverQuery: MovieDiscoverQuery = {
      language,
    };

    if (page !== undefined) {
      discoverQuery.page = page;
    }

    return discoverQuery;
  }

  private static schedulePersistForHits(
    catalog: IMovieCatalogProvider,
    enqueuePersist: (
      details: MovieCatalogDetails,
      language: string,
    ) => Promise<void>,
    hits: MovieSearchHit[],
    language: string,
  ): void {
    for (const hit of hits) {
      const backgroundWork =
        SearchCatalogMoviesUseCase.persistHitInBackground(
          catalog,
          enqueuePersist,
          hit,
          language,
        );
      void backgroundWork;
    }
  }

  private static async persistHitInBackground(
    catalog: IMovieCatalogProvider,
    enqueuePersist: (
      details: MovieCatalogDetails,
      language: string,
    ) => Promise<void>,
    hit: MovieSearchHit,
    language: string,
  ): Promise<void> {
    try {
      const details = await catalog.getMovieDetails(hit.id, language);
      await enqueuePersist(details, language);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.warn("Failed to enqueue catalog persist for search hit", {
        tmdbId: hit.id,
        language,
        errorMessage,
      });
    }
  }
}
