import { movieClient } from "@/lib/api/movie-client";
import {
  UserMovieEntryListFilter,
  UserMovieEntryListResponseDTOSchema,
  UserMovieEntryPatchDTO,
  UserMovieEntryPatchResponseDTOSchema,
} from "../dto/user-movie-entry.dto";
import { UserMovieEntryEntity } from "../entities/user-movie-entry.entity";

export class UserMovieEntryListQueryUtils {
  static buildParams(
    filter: UserMovieEntryListFilter = {},
  ): Record<string, boolean> | undefined {
    const params: Record<string, boolean> = {};

    if (filter.watched === true) {
      params.watched = true;
    }
    if (filter.favorite === true) {
      params.favorite = true;
    }
    if (filter.inWatchlist === true) {
      params.inWatchlist = true;
    }

    const hasParams = Object.keys(params).length > 0;
    if (!hasParams) {
      return undefined;
    }

    return params;
  }
}

export class UserMovieEntryService {
  static async listEntries(
    filter: UserMovieEntryListFilter = {},
  ): Promise<UserMovieEntryEntity[]> {
    const params = UserMovieEntryListQueryUtils.buildParams(filter);
    const { data } = await movieClient.get("/movie/user-entries", { params });
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
