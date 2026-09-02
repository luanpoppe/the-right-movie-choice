export interface IMovieCatalogProvider {
  searchMovies(query: string, page?: number): Promise<unknown>;

  getMovieDetails(movieId: number): Promise<unknown>;
}
