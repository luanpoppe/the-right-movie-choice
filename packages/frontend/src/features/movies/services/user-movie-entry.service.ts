import { movieClient } from "@/lib/api/movie-client";
import {
  UserMovieEntryListResponseDTOSchema,
  UserMovieEntryPatchDTO,
  UserMovieEntryPatchResponseDTOSchema,
} from "../dto/user-movie-entry.dto";
import { UserMovieEntryEntity } from "../entities/user-movie-entry.entity";

export class UserMovieEntryService {
  static async listEntries(): Promise<UserMovieEntryEntity[]> {
    const { data } = await movieClient.get("/movie/user-entries");
    const parsedResponse = UserMovieEntryListResponseDTOSchema.parse(data);

    return parsedResponse.entries;
  }

  static async patchEntry(
    tmdbId: number,
    patch: UserMovieEntryPatchDTO,
  ): Promise<UserMovieEntryEntity | null> {
    const { data } = await movieClient.patch(
      `/movie/user-entries/${tmdbId}`,
      patch,
    );
    const parsedResponse = UserMovieEntryPatchResponseDTOSchema.parse(data);

    return parsedResponse.entry;
  }
}
