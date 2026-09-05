import { FastifyReply, FastifyRequest } from "fastify";
import { BaseException } from "@/core/exceptions/base.exception";
import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import { MovieCatalogDetailsResolver } from "@/domains/movies/infrastructure/providers/movie-catalog-details.resolver";
import { Logger } from "@/lib/logger/logger";
import { StringUtils } from "@/shared/utils/string.utils";

export class TmdbDebugQueryRequiredException extends BaseException {
  statusCode = 400;

  constructor() {
    super("TMDB debug search requires a non-empty query");
  }
}

export class TmdbDebugInvalidMovieIdException extends BaseException {
  statusCode = 400;

  constructor() {
    super("TMDB debug movie id must be a valid number");
  }
}

export class TmdbDebugController {
  constructor(
    private readonly catalog: IMovieCatalogProvider,
    private readonly resolver: MovieCatalogDetailsResolver,
  ) {}

  async search(request: FastifyRequest, reply: FastifyReply) {
    const querystring = request.query as {
      query?: string;
      page?: string;
      language?: string;
    };
    const query = querystring.query;
    if (StringUtils.isEmptyString(query)) {
      throw new TmdbDebugQueryRequiredException();
    }

    const page = TmdbDebugController.parseOptionalPage(querystring.page);
    const language = TmdbDebugController.resolveOptionalLanguage(
      querystring.language,
    );
    const startedAtMs = Date.now();

    Logger.info("TMDB debug search requested", {
      queryLength: query.length,
      page: page ?? 1,
      startedAtMs,
    });

    try {
      const hasLanguage = language !== undefined;
      const result = hasLanguage
        ? await this.catalog.searchMovies(query, page, undefined, language)
        : await this.catalog.searchMovies(query, page);

      const durationMs = Date.now() - startedAtMs;
      TmdbDebugController.logSuccess("TMDB debug search completed", durationMs);

      Logger.debug("TMDB debug search result", {
        page: result.page,
        resultCount: result.results.length,
        durationMs,
        success: true,
      });

      return reply.status(200).send(result);
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      TmdbDebugController.logFailure("TMDB debug search failed", durationMs, error);
      throw error;
    }
  }

  async getMovie(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: string };
    const querystring = request.query as { language?: string };
    const movieId = Number(params.id);
    if (!Number.isInteger(movieId)) {
      throw new TmdbDebugInvalidMovieIdException();
    }

    const language = TmdbDebugController.resolveOptionalLanguage(
      querystring.language,
    );
    const startedAtMs = Date.now();

    Logger.info("TMDB debug movie details requested", {
      movieId,
      startedAtMs,
    });

    try {
      const hasLanguage = language !== undefined;
      const details = hasLanguage
        ? await this.resolver.resolveByTmdbId(movieId, language)
        : await this.resolver.resolveByTmdbId(movieId);

      const durationMs = Date.now() - startedAtMs;
      TmdbDebugController.logSuccess(
        "TMDB debug movie details completed",
        durationMs,
        { movieId },
      );

      return reply.status(200).send(details);
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      TmdbDebugController.logFailure(
        "TMDB debug movie details failed",
        durationMs,
        error,
        { movieId },
      );
      throw error;
    }
  }

  private static parseOptionalPage(
    pageRaw: string | undefined,
  ): number | undefined {
    if (StringUtils.isEmptyString(pageRaw)) {
      return undefined;
    }

    const page = Number(pageRaw);
    if (!Number.isInteger(page)) {
      return undefined;
    }

    return page;
  }

  private static resolveOptionalLanguage(
    languageRaw: string | undefined,
  ): string | undefined {
    const isLanguageEmpty = StringUtils.isEmptyString(languageRaw);
    if (isLanguageEmpty) {
      return undefined;
    }

    return languageRaw;
  }

  private static logSuccess(
    message: string,
    durationMs: number,
    extra?: Record<string, unknown>,
  ) {
    Logger.info(message, {
      durationMs,
      success: true,
      ...extra,
    });
  }

  private static logFailure(
    message: string,
    durationMs: number,
    error: unknown,
    extra?: Record<string, unknown>,
  ) {
    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : String(error);
    Logger.error(message, {
      durationMs,
      success: false,
      error: errorMessage,
      ...extra,
    });
  }
}
