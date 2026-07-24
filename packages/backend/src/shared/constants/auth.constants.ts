export class AuthConstants {
  static readonly REFRESH_TOKEN_REDIS_KEY_PREFIX = "auth:refresh:";

  static buildRefreshTokenRedisKey(tokenId: string): string {
    return `${AuthConstants.REFRESH_TOKEN_REDIS_KEY_PREFIX}${tokenId}`;
  }
}
