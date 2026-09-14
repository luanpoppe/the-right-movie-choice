export class MovieQuerySuggestionPoolConstants {
  // Target number of unique suggestions kept in the database (rotation keeps this cap).
  static readonly POOL_SIZE = 100;

  // How many suggestions each IA batch call asks for.
  static readonly SEED_BATCH_SIZE = 25;

  // Max distinct IA batch calls per seed run — not retries.
  static readonly SEED_MAX_CALLS_PER_RUN = Math.ceil(
    MovieQuerySuggestionPoolConstants.POOL_SIZE /
      MovieQuerySuggestionPoolConstants.SEED_BATCH_SIZE,
  );

  // Max retries for a single failed batch call (timeout / invalid schema).
  static readonly SEED_IA_MAX_RETRIES = 3;

  // Postgres advisory lock key — serializes concurrent seed runs.
  static readonly SEED_ADVISORY_LOCK_KEY = 847291034;
}
