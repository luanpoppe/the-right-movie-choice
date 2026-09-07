import { MovieRecommendationEntity } from "../../domain/entities/movie-recommendation.entity";
import type { IUserMovieEntryRepository } from "../../domain/repositories/user-movie-entry.repository";

export type MovieRecommendationProviderOptions = {
  userId?: number;
  excludeWatched?: boolean;
  userMovieEntryRepository?: IUserMovieEntryRepository;
};

export interface IMovieRecommendationProvider {
  getMovieRecommendation(
    userMessage: string,
    chatId: string,
    options?: MovieRecommendationProviderOptions,
  ): Promise<MovieRecommendationEntity>;
}
