import { MovieQueryExamplesEntity } from "../../domain/entities/movie-query-examples.entity";

export interface IMovieQueryExampleProvider {
  getQueryExamples(): Promise<MovieQueryExamplesEntity>;
}
