import { FastifyReply, FastifyRequest } from "fastify";
import { MovieRecommendationRequestDtoSchema } from "../dto/movie-recommendation.dto";
import { MakeGetMovieRecommendationUseCaseFactory } from "../../factories/make-get-movie-recommendation-use-case.factory";

export async function movieRecommendationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userMessage } = MovieRecommendationRequestDtoSchema.parse(
    request.body
  );

  const useCase = MakeGetMovieRecommendationUseCaseFactory.create();

  const resposta = await useCase.execute(userMessage, "test id");

  return reply.status(200).send({ resposta });
}
