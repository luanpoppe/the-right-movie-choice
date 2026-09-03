import { FastifyInstance } from "fastify";
import { Redis } from "@/lib/redis/redis";
import { MakeTmdbHttpClientFactory } from "@/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import { TmdbLoopbackGuard } from "@/modules/tmdb/infrastructure/http/tmdb-loopback.guard";
import { TmdbDebugController } from "./tmdb-debug.controller";

export async function tmdbDebugControllers(app: FastifyInstance) {
  const redis = new Redis();
  const cache = new TmdbMovieDetailsCache(redis);
  const catalog = MakeTmdbHttpClientFactory.create();
  const controller = new TmdbDebugController(catalog, cache);
  const preHandler = TmdbLoopbackGuard.createPreHandler();

  app.addHook("preHandler", preHandler);

  app.get("/debug/tmdb/search", (request, reply) =>
    controller.search(request, reply),
  );

  app.get("/debug/tmdb/movies/:id", (request, reply) =>
    controller.getMovie(request, reply),
  );
}
