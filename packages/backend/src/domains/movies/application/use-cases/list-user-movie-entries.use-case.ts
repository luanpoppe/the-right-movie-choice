import { Logger } from "@/lib/logger/logger";
import type {
  UserMovieEntryEntity,
  UserMovieEntryListFilter,
} from "../../domain/entities/user-movie-entry.entity";
import { IUserMovieEntryRepository } from "../../domain/repositories/user-movie-entry.repository";

export class ListUserMovieEntriesUseCase {
  constructor(private userMovieEntryRepository: IUserMovieEntryRepository) {}

  async execute(
    userId: number,
    filter: UserMovieEntryListFilter,
  ): Promise<UserMovieEntryEntity[]> {
    const entries = await this.userMovieEntryRepository.listByUser(
      userId,
      filter,
    );

    Logger.debug("📋 User movie entries listed", {
      userId,
      count: entries.length,
    });

    return entries;
  }
}
