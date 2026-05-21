import { Langchain } from "@/lib/langchain/langchain";
import { LangchainMoviesQueryExamplesProvider } from "../providers/langchain-movies-query-examples.provider";
import { GetMoviesQueryExamplesUseCase } from "../../application/use-cases/get-movies-query-examples.use-case";
import { GEMINI_MODELS } from "@/lib/langchain/model/models.enum";

export class MakeGetMoviesQueryExamplesUseCaseFactory {
  static create() {
    const langchain = new Langchain();
    const model = langchain.model.gemini({
      model: GEMINI_MODELS.FLASH_LITE_2_5,
      cache: false,
      temperature: 1.5,
    });

    const movieQueryExamplesProvider = new LangchainMoviesQueryExamplesProvider(
      langchain,
      model
    );

    const useCase = new GetMoviesQueryExamplesUseCase(
      movieQueryExamplesProvider
    );
    return useCase;
  }
}
