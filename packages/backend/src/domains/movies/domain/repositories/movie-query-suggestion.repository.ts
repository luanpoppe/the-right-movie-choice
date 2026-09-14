export interface IMovieQuerySuggestionRepository {
  count(): Promise<number>;

  listTexts(): Promise<string[]>;

  insertManySkipDuplicates(texts: string[]): Promise<number>;
}
