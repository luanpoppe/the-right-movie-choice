import { FastifyReply, FastifyRequest } from "fastify";
import { MovieRecommendationRequestDtoSchema } from "../dto/movie-recommendation.dto";
import { GetMovieRecommendationUseCase } from "../../application/use-cases/get-movie-recommendation.use-case";

export async function movieRecommendationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userMessage } = MovieRecommendationRequestDtoSchema.parse(
    request.body
  );

  const useCase = new GetMovieRecommendationUseCase();

  const resposta = await useCase.execute(userMessage);

  return reply.status(200).send({ resposta });
}
