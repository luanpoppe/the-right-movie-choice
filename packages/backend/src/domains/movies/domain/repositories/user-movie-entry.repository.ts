import {
  UserMovieEntryEntity,
  UserMovieEntryListFilter,
  UserMovieEntryPatch,
} from "../entities/user-movie-entry.entity";

export interface IUserMovieEntryRepository {
  findByUserAndTmdbId(
    userId: number,
    tmdbId: number,
  ): Promise<UserMovieEntryEntity | null>;

  upsert(
    userId: number,
    tmdbId: number,
    patch: UserMovieEntryPatch,
  ): Promise<UserMovieEntryEntity | null>;

  listByUser(
    userId: number,
    filter: UserMovieEntryListFilter,
  ): Promise<UserMovieEntryEntity[]>;
}
