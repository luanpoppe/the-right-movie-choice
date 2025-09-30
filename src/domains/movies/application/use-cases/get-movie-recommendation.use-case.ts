import { Langchain } from "@/lib/langchain/langchain";
import { MovieRecommendationLLMResponseDto } from "../../http/dto/movie-recommendation-llm-response.dto";
import { MovieRecommendationResponseDto } from "../../http/dto/movie-recommendation.dto";
import z from "zod";
import { IChatHistoryRepository } from "@/repositories/chat-history.repository";

export class GetMovieRecommendationUseCase {
  private lg = new Langchain();
  private model = this.lg.model.gemini();

  constructor(private chatHistoryRepository: IChatHistoryRepository) {}

  async execute(userMessage: string): Promise<MovieRecommendationResponseDto> {
    const structuredMovies = await this.getStructuredMoviesRecommendation(
      userMessage
    );
    const structuredMoviesParsed =
      MovieRecommendationLLMResponseDto.parse(structuredMovies);

    const chatResponse = await this.getChatResponse(
      structuredMoviesParsed,
      userMessage
    );

    await this.chatHistoryRepository.addMessage(
      [
        ["user", userMessage],
        ["ai", chatResponse.response.toString()],
      ],
      "chatId"
    );

    console.log({ chatResponse });

    return {
      movies: structuredMoviesParsed,
      response: chatResponse.response.toString(),
    };
  }

  private async getStructuredMoviesRecommendation(userMessage: string) {
    const prompt = this.lg.prompt.create({
      systemaMessage: `Você é uma IA que deve ajudar uma pessoa ou um grupo de pessoas a definir o próximo filme a ser assistido. Você irá receber o pedido do usuário e deverá indicar 03 filmes que atendam aos critérios informados pelo usuário, informando título do filme, diretor, atores e atrizes, ano de lançamento do filme, em qual plataforma de streaming é possível assistir aos filmes em questão, uma breve sinopse do filme, a duração do filme em minutos, a nota do filme no IMDb.`,
      userMessage,
    });

    const resposta = await this.lg.callWithStructuredOutput({
      model: this.model,
      prompt,
      schema: MovieRecommendationLLMResponseDto,
    });

    return resposta;
  }

  private async getChatResponse(
    movies: z.infer<typeof MovieRecommendationLLMResponseDto>,
    userMessage: string
  ) {
    const prompt = this.lg.prompt.create({
      systemaMessage: `Você é uma IA de chatbot que está conversando com uma pessoa ou um grupo de pessoas que quer definir o próximo filme a ser assistido. A lista de filmes sugeridos já foi feito por outra IA, e será informado logo abaixo. Sua função é gerar um texto curto explicando por que os filmes escolhidos pela IA são boas escolhas e abrindo a possibilidade do usuário pedir mais informações. Você não deve falar como se o usuário tivesse escolhido os filmes. Você deve informar aos usuários quais são as sugesteos de filmes.
      
Filmes sugeridos: ${JSON.stringify(movies)}`,
      userMessage,
    });

    const response = await this.model.invoke(prompt);
    return { response: response.content };
  }
}
