import { FastifyReply, FastifyRequest } from "fastify";

import { MakeGetMoviesQueryExamplesUseCaseFactory } from "../../factories/make-get-movies-query-examples-use-case.factory";
import { MoviesQueryExamplesResponseDTO } from "../dto/movies-query-examples.dto";

export async function moviesQueryExamplesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const useCase = MakeGetMoviesQueryExamplesUseCaseFactory.create();

  const { moviesQueryExamples } = await useCase.execute();
  const responseBody: MoviesQueryExamplesResponseDTO = {
    queries: moviesQueryExamples.queryExamples,
  };

  return reply.status(200).send(responseBody);
}
