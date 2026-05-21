import { FastifyInstance } from "fastify";
import { movieRecommendationController } from "./movie-recommendation.controller";
import { moviesQueryExamplesController } from "./movies-query-examples.controller";
import { MovieRecommendationDocs } from "../docs/movie-recommendation.docs";
import { MoviesQueryExamplesDocs } from "../docs/movies-query-examples.docs";

export async function moviesControllers(app: FastifyInstance) {
  app.post(
    "/movie/recommendation",
    MovieRecommendationDocs as any,
    movieRecommendationController
  );

  app.get(
    "/movie/queries",
    MoviesQueryExamplesDocs as any,
    moviesQueryExamplesController
  );
}
