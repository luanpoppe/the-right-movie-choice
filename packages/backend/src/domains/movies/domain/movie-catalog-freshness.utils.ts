export class MovieCatalogFreshnessUtils {
  static readonly DAYS = 30;
  static readonly FRESH_FOR_MS =
    MovieCatalogFreshnessUtils.DAYS * 24 * 60 * 60 * 1000;

  static isFresh(updatedAt: Date, now: Date): boolean {
    const updatedAtMs = updatedAt.getTime();
    const nowMs = now.getTime();
    const ageMs = nowMs - updatedAtMs;
    const freshForMs = MovieCatalogFreshnessUtils.FRESH_FOR_MS;

    if (ageMs >= freshForMs) {
      return false;
    }

    return true;
  }
}
