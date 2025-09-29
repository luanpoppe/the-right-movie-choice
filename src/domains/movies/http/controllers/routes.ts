import { FastifyInstance } from "fastify";
import { movieRecommendationController } from "./movie-recommendation.controller";

export function moviesControllers(app: FastifyInstance) {
  app.post("/movie/recommendation", movieRecommendationController);
}
