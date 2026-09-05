import { FastifyInstance } from "fastify";
import { MovieCatalogDetailsResolver } from "@/domains/movies/infrastructure/providers/movie-catalog-details.resolver";
import { PrismaMovieCatalogRepository } from "@/domains/movies/infrastructure/repositories/movie-catalog/prisma-movie-catalog.repository";
import { CatalogPersistEnqueuer } from "@/domains/movies/infrastructure/workers/catalog-persist.enqueuer";
import { Redis } from "@/lib/redis/redis";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import { MakeTmdbHttpClientFactory } from "@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory";
import { TmdbLoopbackGuard } from "@/modules/tmdb/infrastructure/http/tmdb-loopback.guard";
import { TmdbDebugController } from "./tmdb-debug.controller";

export async function tmdbDebugControllers(app: FastifyInstance) {
  const redis = new Redis();
  const cache = new TmdbMovieDetailsCache(redis);
  const catalog = MakeTmdbHttpClientFactory.create();
  const repo = new PrismaMovieCatalogRepository();
  const enqueuePersist = CatalogPersistEnqueuer.enqueue;
  const resolver = new MovieCatalogDetailsResolver(
    cache,
    repo,
    catalog,
    enqueuePersist,
  );
  const controller = new TmdbDebugController(catalog, resolver);
  const preHandler = TmdbLoopbackGuard.createPreHandler();

  app.addHook("preHandler", preHandler);

  app.get("/debug/tmdb/search", (request, reply) =>
    controller.search(request, reply),
  );

  app.get("/debug/tmdb/movies/:id", (request, reply) =>
    controller.getMovie(request, reply),
  );
}
