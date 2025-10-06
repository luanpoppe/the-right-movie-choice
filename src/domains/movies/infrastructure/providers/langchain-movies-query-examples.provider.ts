import { Langchain } from "@/lib/langchain/langchain";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";
import { IMovieQueryExampleProvider } from "../../application/providers/movie-query-example.provider";
import { MovieQueryExamplesSchema } from "../../domain/entities/movie-query-examples.entity";

export class LangchainMoviesQueryExamplesProvider
  implements IMovieQueryExampleProvider
{
  constructor(private langchain: Langchain, private model: BaseChatModel) {}

  async getQueryExamples() {
    const rawPrompt = `Entregue uma lista de 03 queries curtos de buscas criativas por filmes, em inglês.
    Exemplos de buscas criativas: "Filmes de ação dos anos 80 com personagens femininas fortes", "Filmes dos anos 2000 de fantasia com dragões", "Filmes de ficação científica que envolvam viagem no tempo. Crie novas buscas, não precisa utilizar os meus exemplos.`;

    const prompt = this.langchain.prompt.create({ userMessage: rawPrompt });

    const resposta = await this.langchain.callWithStructuredOutput({
      model: this.model,
      prompt,
      schema: MovieQueryExamplesSchema,
    });

    const parseResult = MovieQueryExamplesSchema.safeParse(resposta);
    if (!parseResult.success) throw new WrongMovieSchemaFromLlmException();

    const result = parseResult.data;

    return result;
  }
}
