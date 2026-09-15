import { AI } from "@luanpoppe/ai";
import { AiConfigBuilder } from "@/lib/ai/ai-config.builder";

import { SeedMovieQuerySuggestionsUseCase } from "../../application/use-cases/seed-movie-query-suggestions.use-case";
import { AiMovieQuerySuggestionBatchProvider } from "../providers/ai-movie-query-suggestion-batch.provider";
import { PrismaMovieQuerySuggestionRepository } from "../repositories/movie-query-suggestion/prisma-movie-query-suggestion.repository";

export class MakeSeedMovieQuerySuggestionsUseCaseFactory {
  static create() {
    const config = AiConfigBuilder.buildFromEnv();
    const ai = new AI(config);
    const batchProvider = new AiMovieQuerySuggestionBatchProvider(ai);
    const movieQuerySuggestionRepository =
      new PrismaMovieQuerySuggestionRepository();

    const useCase = new SeedMovieQuerySuggestionsUseCase(
      movieQuerySuggestionRepository,
      batchProvider,
    );
    return useCase;
  }
}
