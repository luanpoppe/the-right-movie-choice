import { FastifyInstance } from "fastify";
import { moviesQueryExamplesController } from "./movies-query-examples.controller";
import { MovieRecommendationDocs } from "../docs/movie-recommendation.docs";
import { MoviesQueryExamplesDocs } from "../docs/movies-query-examples.docs";
import { MakeMovieRecommendationHttpFactory } from "../../factories/make-movie-recommendation-http.factory";

export async function moviesControllers(app: FastifyInstance) {
  const { preHandler, controller } = MakeMovieRecommendationHttpFactory.create();

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
}
