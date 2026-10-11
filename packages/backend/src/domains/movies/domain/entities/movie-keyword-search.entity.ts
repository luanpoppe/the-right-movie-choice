export type MovieKeywordSearchHit = {
  id: number;
  name: string;
};

export type MovieKeywordSearchPage = {
  page: number;
  results: MovieKeywordSearchHit[];
};
