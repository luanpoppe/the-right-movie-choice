import type { IPopularMoviesProvider } from "@/domains/movies/application/providers/popular-movies.provider";
import type { MovieCatalogDetails } from "@/domains/movies/domain/entities/movie-catalog-details.entity";
import { PopularMoviesConstants } from "@/domains/movies/domain/popular-movies.constants";
import { Logger } from "@/lib/logger/logger";

export type GetPopularMoviesInput = {
  language?: string;
};

export class GetPopularMoviesUseCase {
  constructor(private readonly popularMoviesProvider: IPopularMoviesProvider) {}

  async execute(
    input: GetPopularMoviesInput = {},
  ): Promise<MovieCatalogDetails[]> {
    const language =
      input.language ?? PopularMoviesConstants.DEFAULT_LANGUAGE;
    Logger.info("Getting popular movies", { language });

    const movies = await this.popularMoviesProvider.getPopularMovies(language);
    const limitedMovies = movies.slice(0, PopularMoviesConstants.COUNT);

    Logger.debug("Popular movies ready", { count: limitedMovies.length });
    return limitedMovies;
  }

  async refresh(
    input: GetPopularMoviesInput = {},
  ): Promise<MovieCatalogDetails[]> {
    const language =
      input.language ?? PopularMoviesConstants.DEFAULT_LANGUAGE;
    Logger.info("Refreshing popular movies", { language });

    const movies =
      await this.popularMoviesProvider.refreshPopularMovies(language);

    return movies.slice(0, PopularMoviesConstants.COUNT);
  }
}
