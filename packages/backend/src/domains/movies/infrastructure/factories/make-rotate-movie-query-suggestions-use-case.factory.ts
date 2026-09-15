import { AI } from "@luanpoppe/ai";
import { AiConfigBuilder } from "@/lib/ai/ai-config.builder";

import { RotateMovieQuerySuggestionsUseCase } from "../../application/use-cases/rotate-movie-query-suggestions.use-case";
import { AiMovieQuerySuggestionBatchProvider } from "../providers/ai-movie-query-suggestion-batch.provider";
import { PrismaMovieQuerySuggestionRepository } from "../repositories/movie-query-suggestion/prisma-movie-query-suggestion.repository";

export class MakeRotateMovieQuerySuggestionsUseCaseFactory {
  static create() {
    const config = AiConfigBuilder.buildFromEnv();
    const ai = new AI(config);
    const batchProvider = new AiMovieQuerySuggestionBatchProvider(ai);
    const movieQuerySuggestionRepository =
      new PrismaMovieQuerySuggestionRepository();

    const useCase = new RotateMovieQuerySuggestionsUseCase(
      movieQuerySuggestionRepository,
      batchProvider,
    );
    return useCase;
  }
}
