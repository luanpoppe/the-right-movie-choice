import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type {
  MovieCatalogLookupInput,
  MovieCatalogLookupResult,
} from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import type { MovieCatalogLookupService } from "@/domains/movies/infrastructure/providers/movie-catalog-lookup.service";
import { Logger } from "@/lib/logger/logger";
import { TmdbPosterUtils } from "@/modules/tmdb/domain/tmdb-poster.utils";

export class ChatHistoryCatalogEnrichmentUtils {
  static async enrichMoviePosters(
    history: ChatHistoryEntity,
    catalogRepository: IMovieCatalogRepository,
    catalogLookup: MovieCatalogLookupService,
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
            catalogLookup,
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
    catalogLookup: MovieCatalogLookupService,
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
    if (hasTmdbId) {
      const catalogRecord = await catalogRepository.findByTmdbId(tmdbId);
      const hasCatalogRecord = catalogRecord !== null;
      if (hasCatalogRecord) {
        const posterPathFromCatalog = catalogRecord.details.posterPath;
        const posterUrl = TmdbPosterUtils.buildPosterUrl(posterPathFromCatalog);
        return { ...movie, posterPath: posterUrl };
      }
    }

    return ChatHistoryCatalogEnrichmentUtils.resolveMovieByTitle(
      movie,
      catalogLookup,
      hasTmdbId ? tmdbId : undefined,
    );
  }

  private static async resolveMovieByTitle(
    movie: Record<string, unknown>,
    catalogLookup: MovieCatalogLookupService,
    storedTmdbId: number | undefined,
  ): Promise<Record<string, unknown>> {
    const title = movie.title;
    const hasTitle = typeof title === "string" && title.trim().length > 0;
    if (!hasTitle) {
      return { ...movie, posterPath: null };
    }

    const lookupInput: MovieCatalogLookupInput = { query: title.trim() };
    const releaseYear = movie.releaseYear;
    const hasReleaseYear =
      typeof releaseYear === "number" && Number.isFinite(releaseYear);
    if (hasReleaseYear) {
      lookupInput.year = releaseYear;
    }

    const lookupResult = await catalogLookup.findDetailsByTitle(lookupInput);
    const isLookupMiss = lookupResult.found === false;
    if (isLookupMiss) {
      return { ...movie, posterPath: null };
    }

    return ChatHistoryCatalogEnrichmentUtils.buildResolvedMovie(
      movie,
      lookupResult,
      storedTmdbId,
    );
  }

  private static buildResolvedMovie(
    movie: Record<string, unknown>,
    lookupResult: Extract<MovieCatalogLookupResult, { found: true }>,
    storedTmdbId: number | undefined,
  ): Record<string, unknown> {
    const details = lookupResult.details;
    const posterUrl = TmdbPosterUtils.buildPosterUrl(details.posterPath);
    const resolvedMovie: Record<string, unknown> = {
      ...movie,
      tmdbId: details.tmdbId,
      posterPath: posterUrl,
    };

    if (details.imdbId !== null) {
      resolvedMovie.imdbId = details.imdbId;
    } else {
      delete resolvedMovie.imdbId;
    }

    if (details.tmdbId !== storedTmdbId) {
      Logger.debug("History movie id corrected by title lookup", {
        title: movie.title,
        storedTmdbId,
        resolvedTmdbId: details.tmdbId,
      });
    }

    return resolvedMovie;
  }
}
