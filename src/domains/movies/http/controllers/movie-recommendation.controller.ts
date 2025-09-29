import { FastifyReply, FastifyRequest } from "fastify";
import { MovieRecommendationRequestDto } from "../dto/movie-recommendation.dto";

export async function movieRecommendationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userMessage } = MovieRecommendationRequestDto.parse(request.body);

  try {
    console.log({ userMessage });

    const resposta = "draft answer";

    return reply.status(200).send({ resposta });
  } catch (error) {
    throw new Error();
  }
}
