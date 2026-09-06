import { useContext } from "react";
import { UserMovieEntriesContext } from "./user-movie-entries-context";

export function useUserMovieEntries() {
  const context = useContext(UserMovieEntriesContext);

  if (!context) {
    throw new Error(
      "useUserMovieEntries must be used within UserMovieEntriesProvider",
    );
  }

  return context;
}
