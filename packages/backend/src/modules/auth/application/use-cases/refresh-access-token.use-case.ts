import { randomUUID } from "node:crypto";
import { InvalidRefreshTokenException } from "../../domain/exceptions/invalid-refresh-token.exception";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import { AuthTokensResult } from "../dtos/auth-tokens.dto";
import { IAccessTokenProvider } from "../providers/access-token.provider";

export class RefreshAccessTokenUseCase {
  constructor(
    private refreshTokenRepository: IRefreshTokenRepository,
    private accessTokenProvider: IAccessTokenProvider,
    private refreshTokenTtlSeconds: number,
  ) {}

  async execute(refreshTokenId: string): Promise<AuthTokensResult> {
    const userId =
      await this.refreshTokenRepository.findUserIdByTokenId(refreshTokenId);

    if (userId === null) throw new InvalidRefreshTokenException();

    await this.refreshTokenRepository.delete(refreshTokenId);

    const newRefreshTokenId = randomUUID();

    await this.refreshTokenRepository.save(
      newRefreshTokenId,
      userId,
      this.refreshTokenTtlSeconds,
    );

    const { accessToken, expiresIn } =
      await this.accessTokenProvider.sign(userId);

    return {
      accessToken,
      expiresIn,
      refreshTokenId: newRefreshTokenId,
    };
  }
}
