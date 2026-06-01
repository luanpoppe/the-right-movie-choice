import { env } from "@/env";
import { Redis } from "@/lib/redis/redis";
import { RefreshAccessTokenUseCase } from "../../application/use-cases/refresh-access-token.use-case";
import { JoseAccessTokenProvider } from "../providers/jose-access-token.provider";
import { RedisRefreshTokenRepository } from "../repositories/redis-refresh-token.repository";

export class MakeRefreshAccessTokenUseCaseFactory {
  static create() {
    const redis = new Redis();
    const refreshTokenRepository = new RedisRefreshTokenRepository(redis);
    const accessTokenProvider = new JoseAccessTokenProvider();

    return new RefreshAccessTokenUseCase(
      refreshTokenRepository,
      accessTokenProvider,
      env.REFRESH_TOKEN_TTL_SECONDS
    );
  }
}
