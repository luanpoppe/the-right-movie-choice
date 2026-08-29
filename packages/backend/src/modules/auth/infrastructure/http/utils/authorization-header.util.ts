export class AuthorizationHeaderUtils {
  static extractBearerToken(
    authorizationHeader: string | string[] | undefined,
  ): string | undefined {
    if (typeof authorizationHeader !== "string") {
      return undefined;
    }

    const bearerMatch = authorizationHeader.match(/^Bearer\s+(\S+)/i);
    return bearerMatch?.[1];
  }
}
