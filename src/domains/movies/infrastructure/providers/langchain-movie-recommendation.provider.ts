import { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import { IMovieRecommendationProvider } from "../../application/providers/movie-recommendation.provider";
import {
  MovieRecommendationEntity,
  MovieRecommendationSchema,
} from "../../domain/entities/movie-recommendation.entity";
import { Langchain } from "@/lib/langchain/langchain";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";

export class LangchainMovieRecommendationProvider
  implements IMovieRecommendationProvider
{
  constructor(private langchain: Langchain, private model: BaseChatModel) {}

  async getStructuredMoviesRecommendation(
    userMessage: string,
    chatHistory: ChatHistoryEntity
  ) {
    const systemPrompt = `Você é uma IA que deve ajudar uma pessoa ou um grupo de pessoas a definir o próximo filme a ser assistido. Você irá receber o pedido do usuário e deverá indicar 03 filmes que atendam aos critérios informados pelo usuário, informando título do filme, diretor, atores e atrizes, ano de lançamento do filme, em qual plataforma de streaming é possível assistir aos filmes em questão, uma breve sinopse do filme, a duração do filme em minutos, a nota do filme no IMDb.`;

    const newChatHistory = [...chatHistory];
    newChatHistory.unshift(["system", systemPrompt]);
    newChatHistory.push(["user", userMessage]);

    const prompt = this.langchain.prompt.parseChatHistory(newChatHistory);

    const resposta = await this.langchain.callWithStructuredOutput({
      model: this.model,
      prompt,
      schema: MovieRecommendationSchema,
    });

    const parseResult = MovieRecommendationSchema.safeParse(resposta);
    if (!parseResult.success) throw new WrongMovieSchemaFromLlmException();

    const result = parseResult.data;

    return result;
  }

  async getChatResponse(
    movies: MovieRecommendationEntity,
    userMessage: string,
    chatHistory: ChatHistoryEntity
  ) {
    const newChatHistory = [...chatHistory];
    const systemPrompt = `Você é uma IA de chatbot que está conversando com uma pessoa ou um grupo de pessoas que quer definir o próximo filme a ser assistido. A lista de filmes sugeridos já foi feito por outra IA, e será informado logo abaixo. Sua função é gerar um texto curto explicando por que os filmes escolhidos pela IA são boas escolhas e abrindo a possibilidade do usuário pedir mais informações. Você não deve falar como se o usuário tivesse escolhido os filmes. Você deve informar aos usuários quais são as sugesteos de filmes.
      
Filmes sugeridos: ${JSON.stringify(movies)}`;
    newChatHistory.unshift(["system", systemPrompt]);
    console.log({ newChatHistory });
    newChatHistory.push(["user", userMessage]);

    const prompt = this.langchain.prompt.parseChatHistory(newChatHistory);

    const response = await this.model.invoke(prompt);
    return response.content.toString();
  }
}
