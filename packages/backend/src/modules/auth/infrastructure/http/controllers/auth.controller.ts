import { FastifyReply, FastifyRequest } from "fastify";
import { InvalidRefreshTokenException } from "../../../domain/exceptions/invalid-refresh-token.exception";
import { MakeAuthenticateWithGoogleUseCaseFactory } from "../../factories/make-authenticate-with-google-use-case.factory";
import { MakeLoginUseCaseFactory } from "../../factories/make-login-use-case.factory";
import { MakeLogoutUseCaseFactory } from "../../factories/make-logout-use-case.factory";
import { MakeRefreshAccessTokenUseCaseFactory } from "../../factories/make-refresh-access-token-use-case.factory";
import { RefreshTokenCookie } from "../cookie/refresh-token.cookie";
import {
  AuthTokensResponse,
  GoogleAuthRequest,
  LoginRequest,
} from "../dto/auth.dto";

export async function loginController(
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  const useCase = MakeLoginUseCaseFactory.create();
  const result = await useCase.execute({ email, password });

  const responseBody: AuthTokensResponse = {
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    tokenType: "Bearer",
  };

  return reply
    .status(200)
    .setCookie(
      RefreshTokenCookie.getName(),
      result.refreshTokenId,
      RefreshTokenCookie.buildOptions()
    )
    .send(responseBody);
}

export async function googleAuthController(
  request: FastifyRequest<{ Body: GoogleAuthRequest }>,
  reply: FastifyReply,
) {
  const { idToken } = request.body;

  const useCase = MakeAuthenticateWithGoogleUseCaseFactory.create();
  const result = await useCase.execute({ idToken });

  const responseBody: AuthTokensResponse = {
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    tokenType: "Bearer",
  };

  return reply
    .status(200)
    .setCookie(
      RefreshTokenCookie.getName(),
      result.refreshTokenId,
      RefreshTokenCookie.buildOptions(),
    )
    .send(responseBody);
}

export async function refreshController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const refreshTokenId = request.cookies[RefreshTokenCookie.getName()];

  if (!refreshTokenId) {
    throw new InvalidRefreshTokenException();
  }

  const useCase = MakeRefreshAccessTokenUseCaseFactory.create();
  const result = await useCase.execute(refreshTokenId);

  const responseBody: AuthTokensResponse = {
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    tokenType: "Bearer",
  };

  return reply
    .status(200)
    .setCookie(
      RefreshTokenCookie.getName(),
      result.refreshTokenId,
      RefreshTokenCookie.buildOptions()
    )
    .send(responseBody);
}

export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const refreshTokenId = request.cookies[RefreshTokenCookie.getName()];

  const useCase = MakeLogoutUseCaseFactory.create();
  await useCase.execute(refreshTokenId);

  return reply
    .status(204)
    .clearCookie(
      RefreshTokenCookie.getName(),
      RefreshTokenCookie.buildClearOptions()
    )
    .send();
}
