import { GetPopularMoviesUseCase } from "@/domains/movies/application/use-cases/get-popular-movies.use-case";
import { MovieCatalogDetailsResolver } from "@/domains/movies/infrastructure/providers/movie-catalog-details.resolver";
import { PopularMoviesProvider } from "@/domains/movies/infrastructure/providers/popular-movies.provider";
import { PrismaMovieCatalogRepository } from "@/domains/movies/infrastructure/repositories/movie-catalog/prisma-movie-catalog.repository";
import { CatalogPersistEnqueuer } from "@/domains/movies/infrastructure/workers/catalog-persist.enqueuer";
import { Redis } from "@/lib/redis/redis";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import { MakeTmdbHttpClientFactory } from "@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory";

import { PopularMoviesController } from "../http/controllers/popular-movies.controller";

export class MakePopularMoviesHttpFactory {
  static create() {
    const redis = new Redis();
    const cache = new TmdbMovieDetailsCache(redis);
    const catalog = MakeTmdbHttpClientFactory.create();
    const repository = new PrismaMovieCatalogRepository();
    const enqueuePersist = CatalogPersistEnqueuer.enqueue;

    const detailsResolver = new MovieCatalogDetailsResolver(
      cache,
      repository,
      catalog,
      enqueuePersist,
    );
    const popularMoviesProvider = new PopularMoviesProvider(
      redis,
      catalog,
      detailsResolver,
    );
    const getPopularMoviesUseCase = new GetPopularMoviesUseCase(
      popularMoviesProvider,
    );
    const handlers = PopularMoviesController.create({
      getPopularMoviesUseCase,
    });

    return { getPopularMoviesUseCase, handlers };
  }
}
