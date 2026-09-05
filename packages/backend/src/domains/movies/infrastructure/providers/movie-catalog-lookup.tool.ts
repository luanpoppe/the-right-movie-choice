import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import type {
  MovieCatalogLookupInput,
  MovieCatalogLookupResult,
} from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import { Logger } from "@/lib/logger/logger";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";
import { StringUtils } from "@/shared/utils/string.utils";

export class MovieCatalogLookupTool {
  constructor(private readonly catalog: IMovieCatalogProvider) {}

  async lookup(
    input: MovieCatalogLookupInput,
  ): Promise<MovieCatalogLookupResult> {
    const isQueryEmpty = StringUtils.isEmptyString(input.query);
    if (isQueryEmpty) {
      return this.miss(
        "Informe o nome de um filme para buscar no catálogo.",
      );
    }

    const startedAtMs = Date.now();

    try {
      const searchQuery = MovieCatalogLookupTool.buildSearchQuery(input);
      const searchPage = await this.catalog.searchMovies(searchQuery);
      const firstHit = searchPage.results[0];
      const hasSearchResults = firstHit !== undefined;

      if (!hasSearchResults) {
        return this.miss(`Nenhum filme encontrado para "${searchQuery}".`);
      }

      const movieId = firstHit.id;
      const details = await this.catalog.getMovieDetails(movieId);
      const durationMs = Date.now() - startedAtMs;
      this.logSuccess("Lookup no catálogo concluído", durationMs);

      return {
        found: true,
        details,
      };
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      const isTmdbHttpError = error instanceof TmdbHttpException;

      if (isTmdbHttpError) {
        this.logFailure(
          "Lookup no catálogo falhou (TMDB indisponível)",
          durationMs,
          error,
        );
        return this.miss(
          "O catálogo de filmes está temporariamente indisponível. Tente novamente mais tarde.",
        );
      }

      this.logFailure("Lookup no catálogo falhou", durationMs, error);
      return this.miss(
        "Não foi possível consultar o catálogo de filmes no momento.",
      );
    }
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

  private static buildSearchQuery(input: MovieCatalogLookupInput): string {
    const hasYear = input.year !== undefined;
    if (!hasYear) {
      return input.query;
    }

    const yearText = String(input.year);
    const searchQuery = `${input.query} ${yearText}`;
    return searchQuery;
  }
}
