import { FastifyReply, FastifyRequest } from "fastify";
import { MovieRecommendationRequestDtoSchema } from "../dto/movie-recommendation.dto";
import { MakeGetMovieRecommendationUseCaseFactory } from "../../factories/make-get-movie-recommendation-use-case.factory";
import { HeadersDTOSchema } from "@/http/dto/headers.dto";

export async function movieRecommendationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userMessage } = MovieRecommendationRequestDtoSchema.parse(
    request.body
  );

  const { chatid } = HeadersDTOSchema.parse(request.headers);

  const useCase = MakeGetMovieRecommendationUseCaseFactory.create();

  const resposta = await useCase.execute(userMessage, chatid);

  return reply.status(200).send({ resposta });
}
