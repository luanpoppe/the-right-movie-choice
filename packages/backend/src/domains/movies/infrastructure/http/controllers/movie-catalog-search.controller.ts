import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { Logger } from "@/lib/logger/logger";
import { DiscoverCatalogMoviesUseCase } from "@/domains/movies/application/use-cases/discover-catalog-movies.use-case";
import {
  SearchCatalogKeywordsInput,
  SearchCatalogKeywordsUseCase,
} from "@/domains/movies/application/use-cases/search-catalog-keywords.use-case";
import {
  SearchCatalogMoviesInput,
  SearchCatalogMoviesUseCase,
} from "@/domains/movies/application/use-cases/search-catalog-movies.use-case";
import {
  SearchCatalogPeopleInput,
  SearchCatalogPeopleUseCase,
} from "@/domains/movies/application/use-cases/search-catalog-people.use-case";
import type { MovieDiscoverQuery } from "@/domains/movies/domain/entities/movie-discover-query.entity";
import { MovieCatalogSearchValidationException } from "@/domains/movies/domain/movie-catalog-search.constants";
import {
  MovieCatalogDiscoverQuery,
  MovieCatalogDiscoverQuerySchema,
  MovieCatalogKeywordsQuery,
  MovieCatalogKeywordsQuerySchema,
  MovieCatalogPeopleQuery,
  MovieCatalogPeopleQuerySchema,
  MovieCatalogSearchQuery,
  MovieCatalogSearchQuerySchema,
  MovieKeywordSearchPageResponseDTO,
  MoviePersonSearchPageResponseDTO,
  MovieSearchPageResponseDTO,
} from "../dto/movie-catalog-search.dto";

export type MovieCatalogSearchControllerParams = {
  searchCatalogMoviesUseCase: SearchCatalogMoviesUseCase;
  searchCatalogPeopleUseCase: SearchCatalogPeopleUseCase;
  searchCatalogKeywordsUseCase: SearchCatalogKeywordsUseCase;
  discoverCatalogMoviesUseCase: DiscoverCatalogMoviesUseCase;
};

export type MovieCatalogSearchControllerHandlers = {
  search: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  people: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  keywords: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  discover: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
};

export class MovieCatalogSearchController {
  static create(
    params: MovieCatalogSearchControllerParams,
  ): MovieCatalogSearchControllerHandlers {
    return {
      search: MovieCatalogSearchController.createSearchHandler(params),
      people: MovieCatalogSearchController.createPeopleHandler(params),
      keywords: MovieCatalogSearchController.createKeywordsHandler(params),
      discover: MovieCatalogSearchController.createDiscoverHandler(params),
    };
  }

  private static createSearchHandler(
    params: MovieCatalogSearchControllerParams,
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const query = MovieCatalogSearchController.parseOrThrow(
        MovieCatalogSearchQuerySchema,
        request.query,
      );

      Logger.info("🔎 Searching catalog movies", {
        query: query.query ?? "",
        page: query.page,
        year: query.year,
        language: query.language,
      });

      const input = MovieCatalogSearchController.buildSearchInput(query);
      const result = await params.searchCatalogMoviesUseCase.execute(input);
      const responseBody: MovieSearchPageResponseDTO = result;

      Logger.debug("✅ Catalog movies searched", {
        page: result.page,
        count: result.results.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createPeopleHandler(
    params: MovieCatalogSearchControllerParams,
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const query = MovieCatalogSearchController.parseOrThrow(
        MovieCatalogPeopleQuerySchema,
        request.query,
      );

      Logger.info("🔎 Searching catalog people", {
        query: query.query,
        page: query.page,
        language: query.language,
      });

      const input = MovieCatalogSearchController.buildPeopleInput(query);
      const result = await params.searchCatalogPeopleUseCase.execute(input);
      const responseBody: MoviePersonSearchPageResponseDTO = result;

      Logger.debug("✅ Catalog people searched", {
        page: result.page,
        count: result.results.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createKeywordsHandler(
    params: MovieCatalogSearchControllerParams,
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const query = MovieCatalogSearchController.parseOrThrow(
        MovieCatalogKeywordsQuerySchema,
        request.query,
      );

      Logger.info("🔎 Searching catalog keywords", {
        query: query.query,
        page: query.page,
      });

      const input = MovieCatalogSearchController.buildKeywordsInput(query);
      const result = await params.searchCatalogKeywordsUseCase.execute(input);
      const responseBody: MovieKeywordSearchPageResponseDTO = result;

      Logger.debug("✅ Catalog keywords searched", {
        page: result.page,
        count: result.results.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createDiscoverHandler(
    params: MovieCatalogSearchControllerParams,
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const query = MovieCatalogSearchController.parseOrThrow(
        MovieCatalogDiscoverQuerySchema,
        request.query,
      );

      Logger.info("🔎 Discovering catalog movies", {
        page: query.page,
        language: query.language,
      });

      const input = MovieCatalogSearchController.buildDiscoverInput(query);
      const result = await params.discoverCatalogMoviesUseCase.execute(input);
      const responseBody: MovieSearchPageResponseDTO = result;

      Logger.debug("✅ Catalog movies discovered", {
        page: result.page,
        count: result.results.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static buildSearchInput(
    query: MovieCatalogSearchQuery,
  ): SearchCatalogMoviesInput {
    const input: SearchCatalogMoviesInput = {};

    if (query.query !== undefined) {
      input.query = query.query;
    }
    if (query.page !== undefined) {
      input.page = query.page;
    }
    if (query.year !== undefined) {
      input.year = query.year;
    }
    if (query.language !== undefined) {
      input.language = query.language;
    }

    return input;
  }

  private static buildPeopleInput(
    query: MovieCatalogPeopleQuery,
  ): SearchCatalogPeopleInput {
    const input: SearchCatalogPeopleInput = { query: query.query };

    if (query.page !== undefined) {
      input.page = query.page;
    }
    if (query.language !== undefined) {
      input.language = query.language;
    }

    return input;
  }

  private static buildKeywordsInput(
    query: MovieCatalogKeywordsQuery,
  ): SearchCatalogKeywordsInput {
    const input: SearchCatalogKeywordsInput = { query: query.query };

    if (query.page !== undefined) {
      input.page = query.page;
    }

    return input;
  }

  private static buildDiscoverInput(
    query: MovieCatalogDiscoverQuery,
  ): MovieDiscoverQuery {
    const input: MovieDiscoverQuery = {};

    if (query.genres !== undefined) {
      input.genres = query.genres;
    }
    if (query.cast !== undefined) {
      input.cast = query.cast;
    }
    if (query.director !== undefined) {
      input.director = query.director;
    }
    if (query.keyword !== undefined) {
      input.keyword = query.keyword;
    }
    if (query.minRating !== undefined) {
      input.minRating = query.minRating;
    }
    if (query.yearFrom !== undefined) {
      input.yearFrom = query.yearFrom;
    }
    if (query.yearTo !== undefined) {
      input.yearTo = query.yearTo;
    }
    if (query.runtimeFrom !== undefined) {
      input.runtimeFrom = query.runtimeFrom;
    }
    if (query.runtimeTo !== undefined) {
      input.runtimeTo = query.runtimeTo;
    }
    if (query.certificationCountry !== undefined) {
      input.certificationCountry = query.certificationCountry;
    }
    if (query.certification !== undefined) {
      input.certification = query.certification;
    }
    if (query.page !== undefined) {
      input.page = query.page;
    }
    if (query.language !== undefined) {
      input.language = query.language;
    }

    return input;
  }

  private static parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
    const parsed = schema.safeParse(data);

    if (parsed.success) {
      return parsed.data;
    }

    const firstIssue = parsed.error.issues[0];
    const message = firstIssue?.message ?? "Validation failed";

    throw new MovieCatalogSearchValidationException(message);
  }
}
