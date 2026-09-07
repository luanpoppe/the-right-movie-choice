import { FastifyReply, FastifyRequest } from "fastify";
import { CookieSerializeOptions } from "@fastify/cookie";
import { MovieRecommendationRequest } from "../dto/movie-recommendation.dto";

import { MissingHeaderException } from "@/core/exceptions/missing-header.exception";
import {
  HeadersDTO,
  HeadersDTOSchema,
} from "@/infrastructure/http/dto/headers.dto";
import { GetMovieRecommendationUseCaseOptions } from "@/domains/movies/application/use-cases/get-movie-recommendation.use-case";
import { MakeGetMovieRecommendationUseCaseFactory } from "../../factories/make-get-movie-recommendation-use-case.factory";
import { GuestQuotaService } from "@/domains/movies/application/guest-quota.service";
import { GuestQuotaConstants } from "@/domains/movies/domain/guest-quota.constants";
import { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { env } from "@/env";
import { MovieRecommendationResponseMapper } from "../mappers/movie-recommendation-response.mapper";

type MovieRecommendationControllerDeps = {
  guestQuotaService: GuestQuotaService;
  catalogRepository: IMovieCatalogRepository;
};

export class MovieRecommendationController {
  static create(deps: MovieRecommendationControllerDeps) {
    const { guestQuotaService, catalogRepository } = deps;
    const responseMapper = new MovieRecommendationResponseMapper(
      catalogRepository,
    );

    return async (
      request: FastifyRequest<{
        Body: MovieRecommendationRequest;
        Headers: HeadersDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const { userMessage } = request.body;

      const parsed = HeadersDTOSchema.safeParse(request.headers);
      if (!parsed.success) throw new MissingHeaderException("chatid");
      const { chatid } = parsed.data;

      const useCase = MakeGetMovieRecommendationUseCaseFactory.create();
      const useCaseOptions =
        MovieRecommendationController.resolveUseCaseOptions(request);

      const { movies, response } = await useCase.execute(
        userMessage,
        chatid,
        useCaseOptions,
      );
      const responseBody = await responseMapper.toResponse(movies, response);

      const movieAuth = request.movieAuth;
      const isAnonymous =
        movieAuth !== undefined && movieAuth.kind === "anonymous";

      if (!isAnonymous) {
        return reply.status(200).send(responseBody);
      }

      const remaining = await guestQuotaService.incrementAfterSuccess(
        movieAuth.guestId,
      );

      reply.setCookie(
        GuestQuotaConstants.COOKIE_NAME,
        movieAuth.guestId,
        MovieRecommendationController.guestIdCookieOptions(),
      );

      reply.header(
        GuestQuotaConstants.RESPONSE_HEADER_REMAINING,
        String(remaining),
      );

      return reply.status(200).send(responseBody);
    };
  }

  private static resolveUseCaseOptions(
    request: FastifyRequest<{ Body: MovieRecommendationRequest }>,
  ): GetMovieRecommendationUseCaseOptions | undefined {
    const movieAuth = request.movieAuth;
    const isAuthenticated =
      movieAuth !== undefined && movieAuth.kind === "authenticated";

    if (!isAuthenticated) {
      return undefined;
    }

    const bodyExcludeWatched = request.body.excludeWatched;
    const excludeWatched = bodyExcludeWatched ?? true;

    return {
      userId: movieAuth.userId,
      excludeWatched,
    };
  }

  private static guestIdCookieOptions(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "prod",
      sameSite: "lax",
      path: "/",
      maxAge: GuestQuotaConstants.TTL_SECONDS,
    };
  }
}
