import { env } from "@/env";
import { Redis } from "@/lib/redis/redis";
import { PrismaUserCredentialsRepository } from "@/modules/users/infrastructure/repositories/prisma-user-credentials.repository";
import { LoginUseCase } from "../../application/use-cases/login.use-case";
import { JoseAccessTokenProvider } from "../providers/jose-access-token.provider";
import { RedisRefreshTokenRepository } from "../repositories/redis-refresh-token.repository";

export class MakeLoginUseCaseFactory {
  static create() {
    const redis = new Redis();
    const userCredentialsRepository = new PrismaUserCredentialsRepository();
    const refreshTokenRepository = new RedisRefreshTokenRepository(redis);
    const accessTokenProvider = new JoseAccessTokenProvider();

    return new LoginUseCase(
      userCredentialsRepository,
      refreshTokenRepository,
      accessTokenProvider,
      env.REFRESH_TOKEN_TTL_SECONDS
    );
  }
}
