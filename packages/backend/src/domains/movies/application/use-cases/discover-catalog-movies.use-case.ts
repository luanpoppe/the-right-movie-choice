import { Logger } from "@/lib/logger/logger";
import type { MovieCatalogDetails } from "../../domain/entities/movie-catalog-details.entity";
import type { MovieDiscoverQuery } from "../../domain/entities/movie-discover-query.entity";
import type {
  MovieSearchHit,
  MovieSearchPage,
} from "../../domain/entities/movie-search.entity";
import { MovieCatalogSearchConstants } from "../../domain/movie-catalog-search.constants";
import { MovieDiscoverValidationUtils } from "../../domain/movie-discover-validation.utils";
import type { IMovieCatalogProvider } from "../providers/movie-catalog.provider";

export class DiscoverCatalogMoviesUseCase {
  constructor(
    private readonly catalog: IMovieCatalogProvider,
    private readonly enqueuePersist: (
      details: MovieCatalogDetails,
      language: string,
    ) => Promise<void>,
  ) {}

  async execute(input: MovieDiscoverQuery): Promise<MovieSearchPage> {
    MovieDiscoverValidationUtils.assertValidQuery(input);

    const resolvedLanguage = MovieCatalogSearchConstants.resolveLanguage(
      input.language,
    );

    const discoverQuery: MovieDiscoverQuery = {
      ...input,
      language: resolvedLanguage,
    };

    const searchPage = await this.catalog.discoverMovies(discoverQuery);

    DiscoverCatalogMoviesUseCase.schedulePersistForHits(
      this.catalog,
      this.enqueuePersist,
      searchPage.results,
      resolvedLanguage,
    );

    return searchPage;
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
        DiscoverCatalogMoviesUseCase.persistHitInBackground(
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
      Logger.warn("Failed to enqueue catalog persist for discover hit", {
        tmdbId: hit.id,
        language,
        errorMessage,
      });
    }
  }
}
