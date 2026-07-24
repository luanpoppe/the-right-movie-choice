import { env } from "@/env";
import { Redis } from "@/lib/redis/redis";
import { AuthSessionFacade } from "../../application/facades/auth-session.facade";
import { JoseAccessTokenProvider } from "../providers/jose-access-token.provider";
import { RedisRefreshTokenRepository } from "../repositories/redis-refresh-token.repository";

export class MakeAuthSessionFacadeFactory {
  static create() {
    const redis = new Redis();
    const refreshTokenRepository = new RedisRefreshTokenRepository(redis);
    const accessTokenProvider = new JoseAccessTokenProvider();

    return new AuthSessionFacade(
      refreshTokenRepository,
      accessTokenProvider,
      env.REFRESH_TOKEN_TTL_SECONDS,
    );
  }
}
