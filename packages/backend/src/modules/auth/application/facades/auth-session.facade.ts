import { randomUUID } from "node:crypto";
import { Logger } from "@/lib/logger/logger";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import { AuthTokensResult } from "../dtos/auth-tokens.dto";
import { IAccessTokenProvider } from "../providers/access-token.provider";

export class AuthSessionFacade {
  constructor(
    private refreshTokenRepository: IRefreshTokenRepository,
    private accessTokenProvider: IAccessTokenProvider,
    private refreshTokenTtlSeconds: number,
  ) {}

  async issue(userId: number): Promise<AuthTokensResult> {
    const refreshTokenId = randomUUID();

    await this.refreshTokenRepository.save(
      refreshTokenId,
      userId,
      this.refreshTokenTtlSeconds,
    );

    const { accessToken, expiresIn } =
      await this.accessTokenProvider.sign(userId);

    Logger.info("💾 Auth session issued", { userId, expiresIn });

    return {
      accessToken,
      expiresIn,
      refreshTokenId,
    };
  }
}
