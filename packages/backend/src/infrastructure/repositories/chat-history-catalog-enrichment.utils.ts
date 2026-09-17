import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { TmdbPosterUtils } from "@/modules/tmdb/domain/tmdb-poster.utils";

export class ChatHistoryCatalogEnrichmentUtils {
  static async enrichMoviePosters(
    history: ChatHistoryEntity,
    catalogRepository: IMovieCatalogRepository,
  ): Promise<ChatHistoryEntity> {
    const enrichedTuples: ChatHistoryEntity = [];

    for (const tuple of history) {
      const hasMovies = tuple.length > 2;
      if (!hasMovies) {
        enrichedTuples.push(tuple);
        continue;
      }

      const role = tuple[0];
      const message = tuple[1];
      const movies = tuple[2];
      if (movies === undefined) {
        enrichedTuples.push(tuple);
        continue;
      }

      const enrichedMovies = await Promise.all(
        movies.map((movie) =>
          ChatHistoryCatalogEnrichmentUtils.enrichMovie(
            movie,
            catalogRepository,
          ),
        ),
      );

      const isAiMessageWithMovies = role === "ai";
      if (!isAiMessageWithMovies) {
        enrichedTuples.push(tuple);
        continue;
      }

      enrichedTuples.push(["ai", message, enrichedMovies]);
    }

    return enrichedTuples;
  }

  private static async enrichMovie(
    movie: Record<string, unknown>,
    catalogRepository: IMovieCatalogRepository,
  ): Promise<Record<string, unknown>> {
    const existingPosterPath = movie.posterPath;
    const hasExistingPosterPath =
      typeof existingPosterPath === "string" && existingPosterPath.length > 0;
    if (hasExistingPosterPath) {
      const posterUrl = TmdbPosterUtils.buildPosterUrl(existingPosterPath);
      const resolvedPosterPath = posterUrl ?? existingPosterPath;
      return { ...movie, posterPath: resolvedPosterPath };
    }

    const tmdbId = movie.tmdbId;
    const hasTmdbId = typeof tmdbId === "number" && tmdbId > 0;
    if (!hasTmdbId) {
      return { ...movie, posterPath: null };
    }

    const catalogRecord = await catalogRepository.findByTmdbId(tmdbId);
    if (catalogRecord === null) {
      return { ...movie, posterPath: null };
    }

    const posterPathFromCatalog = catalogRecord.details.posterPath;
    const posterUrl = TmdbPosterUtils.buildPosterUrl(posterPathFromCatalog);
    return { ...movie, posterPath: posterUrl };
  }
}
