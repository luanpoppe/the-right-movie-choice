import { FastifyInstance } from "fastify";
import { moviesQueryExamplesController } from "./movies-query-examples.controller";
import { MovieRecommendationDocs } from "../docs/movie-recommendation.docs";
import { MoviesQueryExamplesDocs } from "../docs/movies-query-examples.docs";
import {
  UserMovieEntryGetDocs,
  UserMovieEntryListDocs,
  UserMovieEntryPatchDocs,
} from "../docs/user-movie-entry.docs";
import { MakeMovieRecommendationHttpFactory } from "../../factories/make-movie-recommendation-http.factory";
import { MakeUserMovieEntryHttpFactory } from "../../factories/make-user-movie-entry-http.factory";

export async function moviesControllers(app: FastifyInstance) {
  const { preHandler, controller } = MakeMovieRecommendationHttpFactory.create();
  const userMovieEntryHttp = MakeUserMovieEntryHttpFactory.create();

  app.post(
    "/movie/recommendation",
    {
      ...MovieRecommendationDocs,
      preHandler,
    } as any,
    controller,
  );

  app.get(
    "/movie/queries",
    MoviesQueryExamplesDocs as any,
    moviesQueryExamplesController,
  );

  app.get(
    "/movie/user-entries",
    {
      ...UserMovieEntryListDocs,
      preHandler: userMovieEntryHttp.preHandler,
    } as any,
    userMovieEntryHttp.handlers.list,
  );

  app.get(
    "/movie/user-entries/:tmdbId",
    {
      ...UserMovieEntryGetDocs,
      preHandler: userMovieEntryHttp.preHandler,
    } as any,
    userMovieEntryHttp.handlers.getByTmdbId,
  );

  app.patch(
    "/movie/user-entries/:tmdbId",
    {
      ...UserMovieEntryPatchDocs,
      preHandler: userMovieEntryHttp.preHandler,
    } as any,
    userMovieEntryHttp.handlers.patch,
  );
}
