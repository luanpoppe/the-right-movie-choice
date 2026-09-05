import { FastifyReply, FastifyRequest } from "fastify";
import { CookieSerializeOptions } from "@fastify/cookie";
import {
  MovieRecommendationRequest,
  MovieRecommendationResponseDTO,
} from "../dto/movie-recommendation.dto";

import { MissingHeaderException } from "@/core/exceptions/missing-header.exception";
import {
  HeadersDTO,
  HeadersDTOSchema,
} from "@/infrastructure/http/dto/headers.dto";
import { MakeGetMovieRecommendationUseCaseFactory } from "../../factories/make-get-movie-recommendation-use-case.factory";
import { GuestQuotaService } from "@/domains/movies/application/guest-quota.service";
import { GuestQuotaConstants } from "@/domains/movies/domain/guest-quota.constants";
import {
  SingleMovieReccomendationInternalEntity,
  SingleMovieReccomendationSchema,
} from "@/domains/movies/domain/entities/movie-recommendation.entity";
import { env } from "@/env";

export class MovieRecommendationController {
  static create(guestQuotaService: GuestQuotaService) {
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

      const { movies, response } = await useCase.execute(userMessage, chatid);
      const responseBody = MovieRecommendationController.toPublicResponseBody(
        movies,
        response,
      );

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

  private static toPublicResponseBody(
    movies: SingleMovieReccomendationInternalEntity[],
    response: string,
  ): MovieRecommendationResponseDTO {
    const publicMovies = movies.map((movie) => {
      const publicMovie = SingleMovieReccomendationSchema.parse(movie);
      return publicMovie;
    });

    const responseBody: MovieRecommendationResponseDTO = {
      response,
      movies: publicMovies,
    };
    return responseBody;
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
