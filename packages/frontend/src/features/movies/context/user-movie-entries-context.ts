import { createContext } from "react";
import { UserMovieEntryPatchDTO } from "../dto/user-movie-entry.dto";
import { UserMovieEntryFlags } from "./user-movie-entry-merge.utils";

export type UserMovieEntriesContextValue = {
  getFlags: (tmdbId: number) => UserMovieEntryFlags;
  hasEntry: (tmdbId: number) => boolean;
  patchEntry: (
    tmdbId: number,
    patch: UserMovieEntryPatchDTO,
  ) => Promise<boolean>;
  isLoading: boolean;
  isPatching: (tmdbId: number) => boolean;
};

export const UserMovieEntriesContext =
  createContext<UserMovieEntriesContextValue | null>(null);
