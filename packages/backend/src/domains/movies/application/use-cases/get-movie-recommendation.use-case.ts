import {
  IMovieRecommendationProvider,
  MovieRecommendationProviderOptions,
} from "../providers/movie-recommendation.provider";
import type { IUserMovieEntryRepository } from "../../domain/repositories/user-movie-entry.repository";

export type GetMovieRecommendationUseCaseOptions = {
  userId?: number;
  excludeWatched?: boolean;
};

export class GetMovieRecommendationUseCase {
  constructor(
    private movieRecommendationProvider: IMovieRecommendationProvider,
    private userMovieEntryRepository?: IUserMovieEntryRepository,
  ) {}

  async execute(
    userMessage: string,
    chatId: string,
    options?: GetMovieRecommendationUseCaseOptions,
  ) {
    const providerOptions = GetMovieRecommendationUseCase.buildProviderOptions(
      options,
      this.userMovieEntryRepository,
    );

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
    userMovieEntryRepository?: IUserMovieEntryRepository,
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

    const isExcludeMode =
      GetMovieRecommendationUseCase.isExcludeMode(options);
    const hasRepository = userMovieEntryRepository !== undefined;
    if (isExcludeMode && hasRepository) {
      providerOptions.userMovieEntryRepository = userMovieEntryRepository;
    }

    const hasProviderOptions = Object.keys(providerOptions).length > 0;
    if (!hasProviderOptions) {
      return undefined;
    }

    return providerOptions;
  }

  private static isExcludeMode(
    options: GetMovieRecommendationUseCaseOptions,
  ): boolean {
    const excludeWatched = options.excludeWatched === true;
    const userId = options.userId;
    const hasValidUserId = userId !== undefined && userId > 0;

    return excludeWatched && hasValidUserId;
  }
}
