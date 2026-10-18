import { createContext } from "react";
import { UserMovieEntryPatchDTO } from "../dto/user-movie-entry.dto";
import { UserMovieEntryFlags } from "./user-movie-entry-merge.utils";

export type WatchedUndoSnapshot = {
  rating: number | null;
  watchedAt: string | null;
};

export type UserMovieEntriesContextValue = {
  getFlags: (tmdbId: number) => UserMovieEntryFlags;
  hasEntry: (tmdbId: number) => boolean;
  patchEntry: (
    tmdbId: number,
    patch: UserMovieEntryPatchDTO,
  ) => Promise<boolean>;
  isLoading: boolean;
  isPatching: (tmdbId: number) => boolean;
  getWatchedUndo: (tmdbId: number) => WatchedUndoSnapshot | null;
  startWatchedUndo: (tmdbId: number, snapshot: WatchedUndoSnapshot) => void;
  cancelWatchedUndo: (tmdbId: number) => void;
  undoWatchedDelete: (tmdbId: number) => Promise<void>;
};

export const UserMovieEntriesContext =
  createContext<UserMovieEntriesContextValue | null>(null);
