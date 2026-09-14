export interface IMovieQuerySuggestionBatchProvider {
  generateBatch(count: number, existingTexts: string[]): Promise<string[]>;
}
