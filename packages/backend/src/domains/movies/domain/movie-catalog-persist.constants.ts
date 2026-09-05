export class MovieCatalogPersistConstants {
  static readonly QUEUE_NAME = "catalog-movie-persist";
  static readonly BACKOFF_DELAYS_MS = [15_000, 60_000, 300_000]; // 15s, 1m, 5m
  static readonly MAX_ATTEMPTS =
    MovieCatalogPersistConstants.BACKOFF_DELAYS_MS.length + 1;
  static readonly CONCURRENCY = 3;
  static readonly REMOVE_ON_FAIL_COUNT = 500;

  static jobId(tmdbId: number, language: string): string {
    const jobId = `${tmdbId}:${language}`;
    return jobId;
  }
}
