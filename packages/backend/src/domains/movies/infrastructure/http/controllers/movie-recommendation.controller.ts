import { FastifyReply, FastifyRequest } from "fastify";
import {
  MovieRecommendationRequest,
  MovieRecommendationResponseDTO,
} from "../dto/movie-recommendation.dto";

import { MissingHeaderException } from "@/core/exceptions/missing-header.exception";
import {
  HeadersDTO,
  HeadersDTOSchema,
} from "@/infrastructure/http/dto/headers.dto";
import { MakeGetMovieRecommendationUseCaseFactory } from "../../factories/make-get-movie-recommendation-use-case.factory";

export async function movieRecommendationController(
  request: FastifyRequest<{
    Body: MovieRecommendationRequest;
    Headers: HeadersDTO;
  }>,
  reply: FastifyReply
) {
  const { userMessage } = request.body;

  const parsed = HeadersDTOSchema.safeParse(request.headers);
  if (!parsed.success) throw new MissingHeaderException("chatid");
  const { chatid } = parsed.data;

  const useCase = MakeGetMovieRecommendationUseCaseFactory.create();

  const { movies, response } = await useCase.execute(userMessage, chatid);
  const responseBody: MovieRecommendationResponseDTO = {
    response,
    movies,
  };

  return reply.status(200).send(responseBody);
}
