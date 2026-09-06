import { StringUtils } from "@/utils/string.utils";

export class TmdbPosterUtils {
  static resolvePosterUrl(
    posterPath: string | null | undefined,
  ): string | null {
    if (StringUtils.isEmptyString(posterPath)) {
      return null;
    }

    const isValidUrl = TmdbPosterUtils.isValidHttpUrl(posterPath);
    if (!isValidUrl) {
      return null;
    }

    return posterPath;
  }

  private static isValidHttpUrl(value: string): boolean {
    try {
      const parsedUrl = new URL(value);
      const protocol = parsedUrl.protocol;
      const isHttpOrHttps = protocol === "http:" || protocol === "https:";
      return isHttpOrHttps;
    } catch {
      return false;
    }
  }
}
