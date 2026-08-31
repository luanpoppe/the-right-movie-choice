import { randomUUID } from "node:crypto";
import { FastifyRequest } from "fastify";
import { Logger } from "@/lib/logger/logger";
import { IAccessTokenProvider } from "@/modules/auth/application/providers/access-token.provider";
import { GuestQuotaService } from "@/domains/movies/application/guest-quota.service";
import { GuestQuotaConstants } from "@/domains/movies/domain/guest-quota.constants";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import { AuthorizationHeaderUtils } from "@/modules/auth/infrastructure/http/utils/authorization-header.util";

export type MovieAuthContext =
  | { kind: "authenticated"; userId: number }
  | { kind: "anonymous"; guestId: string };

declare module "fastify" {
  interface FastifyRequest {
    movieAuth?: MovieAuthContext;
  }
}

export type MovieRecommendationAuthHookParams = {
  accessTokenProvider: IAccessTokenProvider;
  guestQuotaService: GuestQuotaService;
};

export class MovieRecommendationAuthHook {
  static createPreHandler(params: MovieRecommendationAuthHookParams) {
    return async (request: FastifyRequest): Promise<void> => {
      const authorizationHeader = request.headers.authorization;
      const bearerToken =
        AuthorizationHeaderUtils.extractBearerToken(authorizationHeader);

      if (bearerToken) {
        await MovieRecommendationAuthHook.markAuthenticated(
          request,
          params.accessTokenProvider,
          bearerToken,
        );
        return;
      }

      await MovieRecommendationAuthHook.markAnonymous(
        request,
        params.guestQuotaService,
      );
    };
  }

  private static async markAuthenticated(
    request: FastifyRequest,
    accessTokenProvider: IAccessTokenProvider,
    bearerToken: string,
  ): Promise<void> {
    try {
      const payload = await accessTokenProvider.verify(bearerToken);

      request.movieAuth = {
        kind: "authenticated",
        userId: payload.userId,
      };
      Logger.debug("Movie recommendation request authenticated", {
        userId: payload.userId,
      });
    } catch {
      Logger.info("Movie recommendation rejected invalid access token");
      throw new InvalidAccessTokenException();
    }
  }

  private static async markAnonymous(
    request: FastifyRequest,
    guestQuotaService: GuestQuotaService,
  ): Promise<void> {
    const cookieGuestId = request.cookies[GuestQuotaConstants.COOKIE_NAME];
    const hasCookieGuestId =
      typeof cookieGuestId === "string" && cookieGuestId.length > 0;

    const guestId = hasCookieGuestId ? cookieGuestId : randomUUID();

    await guestQuotaService.assertCanAcceptAnonymousRecommendation(guestId);

    request.movieAuth = { kind: "anonymous", guestId };
    Logger.debug("Movie recommendation request accepted as anonymous", {
      guestIdSuffix: guestId.slice(-4),
    });
  }
}
