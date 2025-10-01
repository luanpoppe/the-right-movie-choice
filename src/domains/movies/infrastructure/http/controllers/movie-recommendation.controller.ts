import { FastifyReply, FastifyRequest } from "fastify";
import {
  MovieRecommendationRequestDtoSchema,
  MovieRecommendationResponseDTO,
} from "../dto/movie-recommendation.dto";

import { MissingHeaderException } from "@/core/exceptions/missing-header.exception";
import { HeadersDTOSchema } from "@/core/http/dto/headers.dto";
import { MakeGetMovieRecommendationUseCaseFactory } from "../../factories/make-get-movie-recommendation-use-case.factory";

export async function movieRecommendationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userMessage } = MovieRecommendationRequestDtoSchema.parse(
    request.body
  );

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
