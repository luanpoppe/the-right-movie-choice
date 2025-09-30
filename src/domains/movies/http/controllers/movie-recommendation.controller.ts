import { FastifyReply, FastifyRequest } from "fastify";
import { MovieRecommendationRequestDtoSchema } from "../dto/movie-recommendation.dto";
import { GetMovieRecommendationUseCase } from "../../application/use-cases/get-movie-recommendation.use-case";
import { ChatHistoryRedisRepository } from "@/repositories/chat-history-redis.repository";
import { Redis } from "@/lib/redis/redis";

export async function movieRecommendationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userMessage } = MovieRecommendationRequestDtoSchema.parse(
    request.body
  );

  const redis = new Redis();
  const chatHistoryRepository = new ChatHistoryRedisRepository(redis);
  const useCase = new GetMovieRecommendationUseCase(chatHistoryRepository);

  const resposta = await useCase.execute(userMessage);

  return reply.status(200).send({ resposta });
}
