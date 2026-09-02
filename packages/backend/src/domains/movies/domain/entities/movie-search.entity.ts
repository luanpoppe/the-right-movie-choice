export type MovieSearchHit = {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
};

export type MovieSearchPage = {
  page: number;
  results: MovieSearchHit[];
};
