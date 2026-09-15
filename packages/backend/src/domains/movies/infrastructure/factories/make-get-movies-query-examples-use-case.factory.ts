import { AI } from "@luanpoppe/ai";
import { AiConfigBuilder } from "@/lib/ai/ai-config.builder";

import { GetMoviesQueryExamplesUseCase } from "../../application/use-cases/get-movies-query-examples.use-case";
import { AiMoviesQueryExamplesProvider } from "../providers/ai-movies-query-examples.provider";
import { PoolFirstMovieQueryExamplesProvider } from "../providers/pool-first-movie-query-examples.provider";
import { PrismaMovieQuerySuggestionRepository } from "../repositories/movie-query-suggestion/prisma-movie-query-suggestion.repository";

export class MakeGetMoviesQueryExamplesUseCaseFactory {
  static create() {
    const config = AiConfigBuilder.buildFromEnv();
    const ai = new AI(config);
    const aiMoviesQueryExamplesProvider = new AiMoviesQueryExamplesProvider(ai);
    const movieQuerySuggestionRepository =
      new PrismaMovieQuerySuggestionRepository();

    const movieQueryExamplesProvider = new PoolFirstMovieQueryExamplesProvider(
      movieQuerySuggestionRepository,
      aiMoviesQueryExamplesProvider,
    );

    const useCase = new GetMoviesQueryExamplesUseCase(
      movieQueryExamplesProvider,
    );
    return useCase;
  }
}
