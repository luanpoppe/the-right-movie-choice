import { TmdbHttpConstants } from "@/modules/tmdb/domain/tmdb-http.constants";

export class TmdbCacheConstants {
  static readonly KEY_TEMPLATE = "catalog:movie:{id}:{lang}";
  static readonly KEY_PREFIX = "catalog:movie:";
  static readonly DETAILS_TTL_SECONDS = 86_400;
  static readonly DEFAULT_LANGUAGE = TmdbHttpConstants.DEFAULT_LANGUAGE;

  static buildKey(movieId: number, lang?: string): string {
    const language = lang ?? TmdbCacheConstants.DEFAULT_LANGUAGE;
    return `${TmdbCacheConstants.KEY_PREFIX}${movieId}:${language}`;
  }
}
