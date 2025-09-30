import { Langchain } from "@/lib/langchain/langchain";
import { MovieRecommendationLLMResponseDto } from "../../http/dto/movie-recommendation-llm-response.dto";
import { MovieRecommendationResponseDto } from "../../http/dto/movie-recommendation.dto";

export class GetMovieRecommendationUseCase {
  async execute(userMessage: string): Promise<MovieRecommendationResponseDto> {
    const lg = new Langchain();
    const model = lg.model.gemini();
    const prompt = lg.prompt.create({
      systemaMessage: `Você é uma IA que deve ajudar uma pessoa ou um grupo de pessoas a definir o próximo filme a ser assistido. Você irá receber o pedido do usuário e deverá indicar 03 filmes que atendam aos critérios informados pelo usuário, informando título do filme, diretor, atores e atrizes, ano de lançamento do filme, em qual plataforma de streaming é possível assistir aos filmes em questão, uma breve sinopse do filme, a duração do filme em minutos, a nota do filme no IMDb.`,
      userMessage,
    });

    const resposta = await lg.callWithStructuredOutput({
      model,
      prompt,
      schema: MovieRecommendationLLMResponseDto,
    });

    console.log({
      resposta: resposta,
    });

    const responseParsed = MovieRecommendationLLMResponseDto.parse(resposta);

    console.log({ responseParsed });

    return { response: responseParsed };
  }
}
