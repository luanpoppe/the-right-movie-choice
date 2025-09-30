import { Langchain } from "@/lib/langchain/langchain";
import { MovieRecommendationLLMResponseDto } from "../../http/dto/movie-recommendation-llm-response.dto";
import { MovieRecommendationResponseDto } from "../../http/dto/movie-recommendation.dto";
import z from "zod";
import { IChatHistoryRepository } from "@/repositories/chat-history.repository";
import { ChatHistoryEntity } from "@/entities/chat-history.entity";

export class GetMovieRecommendationUseCase {
  private lg = new Langchain();
  private model = this.lg.model.gemini();

  constructor(private chatHistoryRepository: IChatHistoryRepository) {}

  async execute(
    userMessage: string,
    chatId: string
  ): Promise<MovieRecommendationResponseDto> {
    const chatHistory = await this.chatHistoryRepository.getHistory(chatId);

    const structuredMovies = await this.getStructuredMoviesRecommendation(
      userMessage,
      chatHistory
    );

    const structuredMoviesParsed =
      MovieRecommendationLLMResponseDto.parse(structuredMovies);

    console.log({ structuredMoviesParsed });

    const chatResponse = await this.getChatResponse(
      structuredMoviesParsed,
      userMessage
    );

    const twoMinutesInSeconds = 120;
    await this.chatHistoryRepository.addMessage(
      [
        ["user", userMessage],
        ["ai", chatResponse.response.toString()],
      ],
      chatId,
      twoMinutesInSeconds
    );

    return {
      movies: structuredMoviesParsed,
      response: chatResponse.response.toString(),
    };
  }

  private async getStructuredMoviesRecommendation(
    userMessage: string,
    chatHistory: ChatHistoryEntity
  ) {
    const prompt = this.lg.prompt.createChatHistory(userMessage, chatHistory);

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
