import { FastifyInstance } from "fastify";
import { movieRecommendationController } from "./movie-recommendation.controller";
import { MovieRecommendationDocs } from "../docs/movie-recommendation.docs";

export function moviesControllers(app: FastifyInstance) {
  app.post(
    "/movie/recommendation",
    MovieRecommendationDocs as any,
    movieRecommendationController
  );
}
