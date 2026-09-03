import { FastifyReply, FastifyRequest } from "fastify";
import { BaseException } from "@/core/exceptions/base.exception";
import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import { Logger } from "@/lib/logger/logger";
import { TmdbMovieDetailsCache } from "@/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache";
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
    private readonly cache: TmdbMovieDetailsCache,
  ) {}

  async search(request: FastifyRequest, reply: FastifyReply) {
    const querystring = request.query as { query?: string; page?: string };
    const query = querystring.query;
    if (StringUtils.isEmptyString(query)) {
      throw new TmdbDebugQueryRequiredException();
    }

    const page = TmdbDebugController.parseOptionalPage(querystring.page);

    Logger.info("TMDB debug search requested", {
      queryLength: query.length,
      page: page ?? 1,
    });

    const result = await this.catalog.searchMovies(query, page);

    Logger.debug("TMDB debug search completed", {
      page: result.page,
      resultCount: result.results.length,
    });

    return reply.status(200).send(result);
  }

  async getMovie(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: string };
    const movieId = Number(params.id);
    if (!Number.isInteger(movieId)) {
      throw new TmdbDebugInvalidMovieIdException();
    }

    const cached = await this.cache.get(movieId);
    if (cached !== null) {
      Logger.info("TMDB debug movie details cache hit", { movieId });
      return reply.status(200).send(cached);
    }

    Logger.info("TMDB debug movie details fetching from TMDB", { movieId });
    const details = await this.catalog.getMovieDetails(movieId);
    await this.cache.set(movieId, details);

    Logger.debug("TMDB debug movie details fetched and cached", { movieId });
    return reply.status(200).send(details);
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
}
