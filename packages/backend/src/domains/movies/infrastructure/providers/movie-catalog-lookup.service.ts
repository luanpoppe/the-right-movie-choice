import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type {
  MovieCatalogLookupInput,
  MovieCatalogLookupResult,
} from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import { MovieCatalogFreshnessUtils } from "@/domains/movies/domain/movie-catalog-freshness.utils";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
  IMovieCatalogRepository,
  MovieCatalogStoredRecord,
} from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { Logger } from "@/lib/logger/logger";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
import { StringUtils } from "@/shared/utils/string.utils";

import { MovieCatalogDetailsResolver } from "./movie-catalog-details.resolver";

export class MovieCatalogLookupService {
  constructor(
    private readonly catalog: IMovieCatalogProvider,
    private readonly repository: IMovieCatalogRepository,
    private readonly cache: TmdbMovieDetailsCache,
    private readonly resolver: MovieCatalogDetailsResolver,
  ) {}

  async findDetailsByTitle(
    input: MovieCatalogLookupInput,
  ): Promise<MovieCatalogLookupResult> {
    const isQueryEmpty = StringUtils.isEmptyString(input.query);
    if (isQueryEmpty) {
      return this.miss("Informe o nome de um filme para buscar no catálogo.");
    }

    const startedAtMs = Date.now();
    const searchQuery = input.query;
    const language = MovieCatalogLookupService.resolveLanguage(input.language);

    try {
      const localHit = await this.tryFindFreshLocalRecord(
        searchQuery,
        input.year,
        language,
      );

      const hasLocalHit = localHit !== null;
      if (hasLocalHit) {
        const durationMs = Date.now() - startedAtMs;
        this.logSuccess(
          "Busca da ficha por título no catálogo concluída",
          durationMs,
        );
        return localHit;
      }

      return await this.findViaTmdbSearch(
        searchQuery,
        input.year,
        language,
        startedAtMs,
      );
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      const isTmdbHttpError = error instanceof TmdbHttpException;

      if (isTmdbHttpError) {
        this.logFailure(
          "Busca da ficha por título no catálogo falhou (TMDB indisponível)",
          durationMs,
          error,
        );
        return this.miss(
          "O catálogo de filmes está temporariamente indisponível. Tente novamente mais tarde.",
        );
      }

      this.logFailure(
        "Busca da ficha por título no catálogo falhou",
        durationMs,
        error,
      );
      return this.miss(
        "Não foi possível consultar o catálogo de filmes no momento.",
      );
    }
  }

  private async tryFindFreshLocalRecord(
    title: string,
    year: number | undefined,
    language: string,
  ): Promise<MovieCatalogLookupResult | null> {
    const localRecord = await this.findLocalRecordByTitleSafely(
      title,
      year,
      language,
    );
    const hasLocalRecord = localRecord !== null;
    if (!hasLocalRecord) return null;

    const now = new Date();
    const updatedAt = localRecord.updatedAt;
    const isFresh = MovieCatalogFreshnessUtils.isFresh(updatedAt, now);
    if (!isFresh) return null;

    const details = localRecord.details;
    const tmdbId = details.tmdbId;
    await this.cache.set(tmdbId, details, language);

    return {
      found: true,
      details,
    };
  }

  private async findLocalRecordByTitleSafely(
    title: string,
    year: number | undefined,
    language: string,
  ): Promise<MovieCatalogStoredRecord | null> {
    try {
      const record = await this.repository.findByTitleAndYear(
        title,
        year,
        language,
      );
      return record;
    } catch (error) {
      MovieCatalogLookupService.logRepositorySkip(title, error);
      return null;
    }
  }

  private async findViaTmdbSearch(
    searchQuery: string,
    year: number | undefined,
    language: string,
    startedAtMs: number,
  ): Promise<MovieCatalogLookupResult> {
    const searchPage = await this.searchCatalog(searchQuery, year, language);
    const firstHit = searchPage.results[0];
    const hasSearchResults = firstHit !== undefined;

    if (!hasSearchResults) {
      return this.miss(`Nenhum filme encontrado para "${searchQuery}".`);
    }

    const movieId = firstHit.id;
    const details = await this.resolver.resolveByTmdbId(movieId, language);
    const durationMs = Date.now() - startedAtMs;
    this.logSuccess(
      "Busca da ficha por título no catálogo concluída",
      durationMs,
    );

    return {
      found: true,
      details,
    };
  }

  private async searchCatalog(
    query: string,
    year: number | undefined,
    language: string,
  ) {
    return this.catalog.searchMovies(query, 1, year, language);
  }

  private static resolveLanguage(language?: string): string {
    const isLanguageEmpty = StringUtils.isEmptyString(language);
    if (isLanguageEmpty) {
      return DEFAULT_MOVIE_CATALOG_LANGUAGE;
    }

    return language;
  }

  private miss(message: string): MovieCatalogLookupResult {
    return { found: false, message };
  }

  private logSuccess(message: string, durationMs: number) {
    Logger.info(message, {
      durationMs,
      success: true,
    });
  }

  private logFailure(message: string, durationMs: number, error: unknown) {
    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : String(error);
    Logger.error(message, {
      durationMs,
      success: false,
      error: errorMessage,
    });
  }

  private static logRepositorySkip(title: string, error: unknown): void {
    const reason = MovieCatalogLookupService.errorMessage(error);
    Logger.warn("Movie catalog findByTitleAndYear failed, skipping to TMDB", {
      title,
      reason,
    });
  }

  private static errorMessage(error: unknown): string {
    const isErrorInstance = error instanceof Error;
    if (isErrorInstance) {
      return error.message;
    }

    return String(error);
  }
}
