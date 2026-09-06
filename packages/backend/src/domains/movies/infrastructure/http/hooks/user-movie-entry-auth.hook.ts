import { FastifyRequest } from "fastify";
import { Logger } from "@/lib/logger/logger";
import { IAccessTokenProvider } from "@/modules/auth/application/providers/access-token.provider";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import { AuthorizationHeaderUtils } from "@/modules/auth/infrastructure/http/utils/authorization-header.util";

export type UserMovieEntryAuthContext = {
  userId: number;
};

declare module "fastify" {
  interface FastifyRequest {
    userMovieEntryAuth?: UserMovieEntryAuthContext;
  }
}

export type UserMovieEntryAuthHookParams = {
  accessTokenProvider: IAccessTokenProvider;
};

export class UserMovieEntryAuthHook {
  static createPreHandler(params: UserMovieEntryAuthHookParams) {
    return async (request: FastifyRequest): Promise<void> => {
      const authorizationHeader = request.headers.authorization;
      const bearerToken =
        AuthorizationHeaderUtils.extractBearerToken(authorizationHeader);

      if (!bearerToken) {
        Logger.info("User movie entry request rejected missing bearer token");
        throw new InvalidAccessTokenException();
      }

      await UserMovieEntryAuthHook.markAuthenticated(
        request,
        params.accessTokenProvider,
        bearerToken,
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

      request.userMovieEntryAuth = {
        userId: payload.userId,
      };
      Logger.debug("User movie entry request authenticated", {
        userId: payload.userId,
      });
    } catch {
      Logger.info("User movie entry request rejected invalid access token");
      throw new InvalidAccessTokenException();
    }
  }
}
