import { Redis } from "@/lib/redis/redis";
import { AuthConstants } from "@/shared/constants/auth.constants";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";

export class RedisRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private redis: Redis) {}

  private key(tokenId: string): string {
    return AuthConstants.buildRefreshTokenRedisKey(tokenId);
  }

  async save(
    tokenId: string,
    userId: number,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.setWithExpiration(
      this.key(tokenId),
      String(userId),
      ttlSeconds,
    );
  }

  async findUserIdByTokenId(tokenId: string): Promise<number | null> {
    const value = await this.redis.getString(this.key(tokenId));

    if (value === null) return null;

    const userId = Number(value);

    const isNumberInvalid = !Number.isInteger(userId) || userId <= 0;
    if (isNumberInvalid) return null;

    return userId;
  }

  async delete(tokenId: string): Promise<void> {
    await this.redis.del(this.key(tokenId));
  }
}
