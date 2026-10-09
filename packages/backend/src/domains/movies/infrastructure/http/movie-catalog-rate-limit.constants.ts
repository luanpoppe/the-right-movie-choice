export class MovieCatalogRateLimitConstants {
  // Conservador: cada chamada bate no TMDB (serviço externo), então 60 req/min
  // por IP protege o upstream sem atrapalhar o uso interativo do catálogo.
  static readonly MAX_REQUESTS_PER_WINDOW = 60;
  static readonly TIME_WINDOW = "1 minute";
}
