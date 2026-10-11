export type MovieDiscoverQuery = {
  page?: number;
  language?: string;
  genres?: number[];
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
  cast?: number[];
  director?: number[];
  keyword?: number[];
  runtimeFrom?: number;
  runtimeTo?: number;
  certificationCountry?: string;
  certification?: string;
};
