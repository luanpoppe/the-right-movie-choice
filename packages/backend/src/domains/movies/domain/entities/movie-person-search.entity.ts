export type MoviePersonKnownFor = {
  id: number;
  title: string;
};

export type MoviePersonSearchHit = {
  id: number;
  name: string;
  knownForDepartment: string | null;
  knownFor: MoviePersonKnownFor[];
};

export type MoviePersonSearchPage = {
  page: number;
  results: MoviePersonSearchHit[];
};
