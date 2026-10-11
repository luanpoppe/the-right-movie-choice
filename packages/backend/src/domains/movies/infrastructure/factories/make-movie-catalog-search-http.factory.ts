import { DiscoverCatalogMoviesUseCase } from "@/domains/movies/application/use-cases/discover-catalog-movies.use-case";
import { SearchCatalogKeywordsUseCase } from "@/domains/movies/application/use-cases/search-catalog-keywords.use-case";
import { SearchCatalogMoviesUseCase } from "@/domains/movies/application/use-cases/search-catalog-movies.use-case";
import { SearchCatalogPeopleUseCase } from "@/domains/movies/application/use-cases/search-catalog-people.use-case";
import { MakeTmdbHttpClientFactory } from "@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory";
import { MovieCatalogSearchController } from "../http/controllers/movie-catalog-search.controller";
import { CatalogPersistEnqueuer } from "../workers/catalog-persist.enqueuer";

export class MakeMovieCatalogSearchHttpFactory {
  static create() {
    const catalog = MakeTmdbHttpClientFactory.create();
    const enqueuePersist = CatalogPersistEnqueuer.enqueue;

    const searchCatalogMoviesUseCase = new SearchCatalogMoviesUseCase(
      catalog,
      enqueuePersist,
    );
    const searchCatalogPeopleUseCase = new SearchCatalogPeopleUseCase(catalog);
    const searchCatalogKeywordsUseCase = new SearchCatalogKeywordsUseCase(
      catalog,
    );
    const discoverCatalogMoviesUseCase = new DiscoverCatalogMoviesUseCase(
      catalog,
      enqueuePersist,
    );

    const handlers = MovieCatalogSearchController.create({
      searchCatalogMoviesUseCase,
      searchCatalogPeopleUseCase,
      searchCatalogKeywordsUseCase,
      discoverCatalogMoviesUseCase,
    });

    return { handlers };
  }
}
