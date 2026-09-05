export type MovieWatchProvider = {
  providerName: string;
  logoPath: string | null;
};

export type MovieCatalogDetails = {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  runtimeMinutes: number | null;
  genres: string[];
  tmdbVoteAverage: number | null;
  originCountries: string[];
  directors: string[];
  cast: string[];
  watchProviders: {
    flatrate: MovieWatchProvider[];
    rent: MovieWatchProvider[];
    buy: MovieWatchProvider[];
  };
  imdbId: string | null;
};
