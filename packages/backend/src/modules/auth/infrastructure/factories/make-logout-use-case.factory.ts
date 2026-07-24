import { Redis } from "@/lib/redis/redis";
import { LogoutUseCase } from "../../application/use-cases/logout.use-case";
import { RedisRefreshTokenRepository } from "../repositories/redis-refresh-token.repository";

export class MakeLogoutUseCaseFactory {
  static create() {
    const redis = new Redis();
    const refreshTokenRepository = new RedisRefreshTokenRepository(redis);

    return new LogoutUseCase(refreshTokenRepository);
  }
}
