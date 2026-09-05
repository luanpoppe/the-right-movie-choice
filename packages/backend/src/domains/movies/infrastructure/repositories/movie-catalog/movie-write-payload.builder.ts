import type { MovieCatalogDetails } from "../../../domain/entities/movie-catalog-details.entity";

export class MovieCatalogMovieWritePayloadBuilder {
  static buildScalars(details: MovieCatalogDetails, language: string) {
    return {
      tmdbId: details.tmdbId,
      language,
      title: details.title,
      year: details.year,
      posterPath: details.posterPath,
      overview: details.overview,
      runtimeMinutes: details.runtimeMinutes,
      tmdbVoteAverage: details.tmdbVoteAverage,
      imdbId: details.imdbId,
    };
  }
}
