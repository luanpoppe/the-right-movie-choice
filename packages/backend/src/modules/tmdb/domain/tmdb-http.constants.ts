export class TmdbHttpConstants {
  static readonly TIMEOUT_MS = 5_000;
  static readonly MAX_RETRIES = 2;
  static readonly BACKOFF_BASE_MS = 1_000;
  static readonly API_BASE_URL = "https://api.themoviedb.org/3";
  static readonly DEFAULT_LANGUAGE = "pt-BR";
}
