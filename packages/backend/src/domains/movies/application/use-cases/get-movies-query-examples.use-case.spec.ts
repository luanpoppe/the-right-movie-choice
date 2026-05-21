import { describe, it, expect, vi } from "vitest";
import { GetMoviesQueryExamplesUseCase } from "./get-movies-query-examples.use-case";
import { IMovieQueryExampleProvider } from "../providers/movie-query-example.provider";

describe("GetMoviesQueryExamplesUseCase", () => {
  it("should call getQueryExamples on the provider and return the examples", async () => {
    const mockMovieQueryExampleProvider: IMovieQueryExampleProvider = {
      getQueryExamples: vi.fn().mockResolvedValue(["example1", "example2"]),
    };

    const useCase = new GetMoviesQueryExamplesUseCase(
      mockMovieQueryExampleProvider
    );

    const result = await useCase.execute();

    expect(
      mockMovieQueryExampleProvider.getQueryExamples
    ).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      moviesQueryExamples: ["example1", "example2"],
    });
  });
});
