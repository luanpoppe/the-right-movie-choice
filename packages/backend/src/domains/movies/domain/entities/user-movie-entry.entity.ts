export type UserMovieEntryEntity = {
  userId: number;
  tmdbId: number;
  movieId: number | null;
  watched: boolean;
  favorite: boolean;
  inWatchlist: boolean;
  rating: number | null;
  watchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserMovieEntryPatch = {
  watched?: boolean;
  favorite?: boolean;
  inWatchlist?: boolean;
  rating?: number | null;
  watchedAt?: Date | null;
  movieId?: number | null;
};

export type UserMovieEntryListFilter = {
  watched?: boolean;
  favorite?: boolean;
  inWatchlist?: boolean;
};
