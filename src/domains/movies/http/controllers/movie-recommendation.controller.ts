import { FastifyReply, FastifyRequest } from "fastify";
import { MovieRecommendationRequestDto } from "../dto/movie-recommendation.dto";
import { Langchain } from "@/lib/langchain/langchain";

export async function movieRecommendationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userMessage } = MovieRecommendationRequestDto.parse(request.body);

  console.log({ userMessage });

  const lg = new Langchain();
  const model = lg.model.gemini();
  const prompt = lg.prompt.create({
    userMessage,
  });

  const resposta = await lg.call({
    model,
    prompt,
  });

  return reply.status(200).send({ resposta });
}
