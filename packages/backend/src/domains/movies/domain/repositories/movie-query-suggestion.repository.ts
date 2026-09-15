export interface IMovieQuerySuggestionRepository {
  count(): Promise<number>;

  listTexts(): Promise<string[]>;

  insertManySkipDuplicates(texts: string[]): Promise<number>;

  pickRandomTexts(limit: number): Promise<string[]>;

  withSeedLock<T>(operation: () => Promise<T>): Promise<T>;

  rotatePoolAtomically(texts: string[]): Promise<void>;
}
