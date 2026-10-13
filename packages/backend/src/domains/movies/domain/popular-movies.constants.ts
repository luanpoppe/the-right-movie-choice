export class PopularMoviesConstants {
  // 3 for the hero + 6 for the "Popular now" section, without repeating.
  static readonly COUNT = 9;

  // Extra candidates fetched so a failed detail resolution does not shrink the list.
  static readonly CANDIDATE_POOL = 13;

  // 26h: comfortably longer than the 24h refresh cycle, short enough to self-heal.
  static readonly CACHE_TTL_SECONDS = 60 * 60 * 26;

  static readonly DEFAULT_LANGUAGE = "en-US";

  static cacheKey(language: string): string {
    return `movie:popular:daily:v2:${language}`;
  }
}
