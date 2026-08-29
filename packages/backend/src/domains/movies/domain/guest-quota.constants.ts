export class GuestQuotaConstants {
  static readonly RECOMMENDATION_LIMIT = 2;
  static readonly REDIS_KEY_PREFIX = "guest:quota:";
  static readonly TTL_SECONDS = 86_400; // 24 hours
  static readonly COOKIE_NAME = "guest-id";
  static readonly RESPONSE_HEADER_REMAINING = "X-Guest-Remaining";

  static buildRedisKey(guestId: string): string {
    return `${GuestQuotaConstants.REDIS_KEY_PREFIX}${guestId}`;
  }
}
