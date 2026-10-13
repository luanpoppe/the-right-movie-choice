import { FastifyReply, FastifyRequest } from "fastify";
import {
  GetPopularMoviesInput,
  GetPopularMoviesUseCase,
} from "@/domains/movies/application/use-cases/get-popular-movies.use-case";
import { MovieCatalogSearchValidationException } from "@/domains/movies/domain/movie-catalog-search.constants";
import { Logger } from "@/lib/logger/logger";
import { PopularMoviesQuerySchema } from "../dto/popular-movies.dto";
import { PopularMoviesResponseMapper } from "../mappers/popular-movies-response.mapper";

export type PopularMoviesControllerParams = {
  getPopularMoviesUseCase: GetPopularMoviesUseCase;
};

export type PopularMoviesControllerHandlers = {
  list: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
};

export class PopularMoviesController {
  static create(
    params: PopularMoviesControllerParams,
  ): PopularMoviesControllerHandlers {
    return {
      list: PopularMoviesController.createListHandler(params),
    };
  }

  private static createListHandler(params: PopularMoviesControllerParams) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedQuery = PopularMoviesQuerySchema.safeParse(request.query);

      if (!parsedQuery.success) {
        const message =
          parsedQuery.error.issues[0]?.message ?? "Validation failed";
        throw new MovieCatalogSearchValidationException(message);
      }

      Logger.info("Listing popular movies", {
        language: parsedQuery.data.language,
      });

      const input: GetPopularMoviesInput = {};
      if (parsedQuery.data.language !== undefined) {
        input.language = parsedQuery.data.language;
      }

      const movies = await params.getPopularMoviesUseCase.execute(input);
      const responseBody = PopularMoviesResponseMapper.toResponse(movies);

      return reply.status(200).send(responseBody);
    };
  }
}
