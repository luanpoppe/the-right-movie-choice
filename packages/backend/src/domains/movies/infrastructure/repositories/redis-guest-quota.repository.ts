import { Redis } from "@/lib/redis/redis";
import { Logger } from "@/lib/logger/logger";
import { GuestQuotaConstants } from "../../domain/guest-quota.constants";
import { IGuestQuotaRepository } from "../../domain/repositories/guest-quota.repository";

export class RedisGuestQuotaRepository implements IGuestQuotaRepository {
  constructor(private redis: Redis) {}

  async getUsedCount(guestId: string): Promise<number> {
    const key = this.key(guestId);
    const value = await this.redis.getString(key);
    const usedCount = this.parseUsedCount(value);

    Logger.debug("Guest quota used count loaded", { usedCount });

    return usedCount;
  }

  async increment(guestId: string): Promise<number> {
    // Read-modify-write: concurrent increments can race; INCR is not available on the Redis wrapper.
    const currentUsedCount = await this.getUsedCount(guestId);
    const nextUsedCount = currentUsedCount + 1;
    const key = this.key(guestId);

    await this.redis.setWithExpiration(
      key,
      String(nextUsedCount),
      GuestQuotaConstants.TTL_SECONDS,
    );

    Logger.info("Guest quota incremented", { usedCount: nextUsedCount });

    return nextUsedCount;
  }

  private key(guestId: string): string {
    return GuestQuotaConstants.buildRedisKey(guestId);
  }

  private parseUsedCount(value: string | null): number {
    if (value === null) return 0;

    const parsed = Number(value);
    const isCountInvalid = !Number.isInteger(parsed) || parsed < 0;
    if (isCountInvalid) return 0;

    return parsed;
  }
}
