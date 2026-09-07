import {
  IMovieRecommendationProvider,
  MovieRecommendationProviderOptions,
} from "../providers/movie-recommendation.provider";

export type GetMovieRecommendationUseCaseOptions = {
  userId?: number;
  excludeWatched?: boolean;
};

export class GetMovieRecommendationUseCase {
  constructor(private movieRecommendationProvider: IMovieRecommendationProvider) {}

  async execute(
    userMessage: string,
    chatId: string,
    options?: GetMovieRecommendationUseCaseOptions,
  ) {
    const providerOptions =
      GetMovieRecommendationUseCase.buildProviderOptions(options);

    const recommendation =
      await this.movieRecommendationProvider.getMovieRecommendation(
        userMessage,
        chatId,
        providerOptions,
      );

    return {
      movies: recommendation.movies,
      response: recommendation.response,
    };
  }

  private static buildProviderOptions(
    options?: GetMovieRecommendationUseCaseOptions,
  ): MovieRecommendationProviderOptions | undefined {
    if (options === undefined) {
      return undefined;
    }

    const providerOptions: MovieRecommendationProviderOptions = {};

    const userId = options.userId;
    if (userId !== undefined) {
      providerOptions.userId = userId;
    }

    const excludeWatched = options.excludeWatched;
    if (excludeWatched !== undefined) {
      providerOptions.excludeWatched = excludeWatched;
    }

    const hasProviderOptions = Object.keys(providerOptions).length > 0;
    if (!hasProviderOptions) {
      return undefined;
    }

    return providerOptions;
  }
}
