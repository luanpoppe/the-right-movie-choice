import { Logger } from "@/lib/logger/logger";
import type { UserMovieEntryEntity } from "../../domain/entities/user-movie-entry.entity";
import { IUserMovieEntryRepository } from "../../domain/repositories/user-movie-entry.repository";
import { UserMovieEntryValidationUtils } from "../../domain/user-movie-entry-validation.utils";

export class GetUserMovieEntryUseCase {
  constructor(private userMovieEntryRepository: IUserMovieEntryRepository) {}

  async execute(
    userId: number,
    tmdbId: number,
  ): Promise<UserMovieEntryEntity | null> {
    UserMovieEntryValidationUtils.assertValidTmdbId(tmdbId);

    const entry = await this.userMovieEntryRepository.findByUserAndTmdbId(
      userId,
      tmdbId,
    );

    if (!entry) {
      Logger.debug("🔍 User movie entry not found", { userId, tmdbId });
    }

    return entry;
  }
}
