import { IMovieQueryExampleProvider } from "../providers/movie-query-example.provider";

export class GetMoviesQueryExamplesUseCase {
  constructor(private movieQueryExampleProvider: IMovieQueryExampleProvider) {}

  async execute() {
    const moviesQueryExamples =
      await this.movieQueryExampleProvider.getQueryExamples();

    return {
      moviesQueryExamples,
    };
  }
}
