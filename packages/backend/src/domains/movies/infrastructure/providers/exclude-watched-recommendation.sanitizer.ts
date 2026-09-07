import type { MovieRecommendationEntity } from "../../domain/entities/movie-recommendation.entity";

export type ExcludeWatchedContextEntry = {
  title: string;
  tmdbId?: number | undefined;
  watched: boolean;
};

export type ExcludeWatchedRoundResult = {
  sanitized: MovieRecommendationEntity;
  verifiedUnwatchedCount: number;
  exclusionEntries: ExcludeWatchedContextEntry[];
};

export class ExcludeWatchedRecommendationSanitizer {
  static sanitize(
    recommendation: MovieRecommendationEntity,
    watchedTmdbIds: ReadonlySet<number>,
  ): MovieRecommendationEntity {
    if (watchedTmdbIds.size === 0) {
      return recommendation;
    }

    const unwatchedMovies = recommendation.movies.filter((movie) => {
      return ExcludeWatchedRecommendationSanitizer.shouldKeepMovie(
        movie.tmdbId,
        watchedTmdbIds,
      );
    });

    return {
      ...recommendation,
      movies: unwatchedMovies,
    };
  }

  static countVerifiedUnwatched(
    recommendation: MovieRecommendationEntity,
  ): number {
    let count = 0;

    for (const movie of recommendation.movies) {
      const hasVerifiedTmdbId = ExcludeWatchedRecommendationSanitizer.hasVerifiedTmdbId(
        movie.tmdbId,
      );
      if (!hasVerifiedTmdbId) {
        continue;
      }

      count++;
    }

    return count;
  }

  static extractTmdbIds(
    movies: MovieRecommendationEntity["movies"],
  ): number[] {
    const tmdbIds: number[] = [];

    for (const movie of movies) {
      const tmdbId = movie.tmdbId;
      if (!ExcludeWatchedRecommendationSanitizer.hasVerifiedTmdbId(tmdbId)) {
        continue;
      }

      tmdbIds.push(tmdbId);
    }

    return tmdbIds;
  }

  static processRoundResult(
    recommendation: MovieRecommendationEntity,
    watchedTmdbIds: ReadonlySet<number>,
    existingEntries: ExcludeWatchedContextEntry[],
  ): ExcludeWatchedRoundResult {
    const entryByKey =
      ExcludeWatchedRecommendationSanitizer.seedExclusionEntryMap(
        existingEntries,
      );
    const hasWatchedFilter = watchedTmdbIds.size > 0;
    const unwatchedMovies: MovieRecommendationEntity["movies"] = [];
    let verifiedUnwatchedCount = 0;

    for (const movie of recommendation.movies) {
      const tmdbId = movie.tmdbId;
      const shouldKeep = ExcludeWatchedRecommendationSanitizer.shouldKeepMovie(
        tmdbId,
        watchedTmdbIds,
      );

      if (shouldKeep) {
        unwatchedMovies.push(movie);
        const hasVerifiedTmdbId = ExcludeWatchedRecommendationSanitizer.hasVerifiedTmdbId(
          tmdbId,
        );
        if (hasVerifiedTmdbId) {
          verifiedUnwatchedCount++;
        }
      }

      const isWatchedInContext =
        ExcludeWatchedRecommendationSanitizer.isMovieWatchedForContext(
          tmdbId,
          watchedTmdbIds,
        );
      const entry: ExcludeWatchedContextEntry = {
        title: movie.title,
        tmdbId,
        watched: isWatchedInContext,
      };
      ExcludeWatchedRecommendationSanitizer.upsertExclusionEntry(
        entryByKey,
        entry,
      );
    }

    const sanitized = hasWatchedFilter
      ? { ...recommendation, movies: unwatchedMovies }
      : recommendation;

    const exclusionEntries = Array.from(entryByKey.values());

    return {
      sanitized,
      verifiedUnwatchedCount,
      exclusionEntries,
    };
  }

  static buildFinalRoundInstructionMessage(
    minVerifiedUnwatched: number,
  ): string {
    return [
      "Contexto interno: esta é a última rodada disponível para este pedido.",
      `Se, após considerar o filtro de já assistidos, você só conseguir entregar menos de ${minVerifiedUnwatched} filmes com tmdbId confirmado que o usuário ainda não assistiu, inclua no campo response um aviso breve e natural de que o histórico dele já cobriu quase tudo que o catálogo conseguiu sugerir para este pedido.`,
      "Escreva esse aviso no mesmo idioma da última mensagem do usuário — não em português por padrão se o usuário escreveu em outro idioma.",
      "Integre o aviso ao texto do response de forma natural.",
    ].join("\n");
  }

  static ensureExhaustionNotice(response: string): string {
    const trimmedResponse = response.trim();
    if (trimmedResponse.length === 0) {
      return ExcludeWatchedRecommendationSanitizer.EXHAUSTION_NOTICE_FALLBACK;
    }

    const hasExhaustionSignal =
      ExcludeWatchedRecommendationSanitizer.EXHAUSTION_NOTICE_MARKERS.some(
        (marker) => marker.test(trimmedResponse),
      );
    if (hasExhaustionSignal) {
      return trimmedResponse;
    }

    return `${trimmedResponse}\n\n${ExcludeWatchedRecommendationSanitizer.EXHAUSTION_NOTICE_FALLBACK}`;
  }

  private static readonly EXHAUSTION_NOTICE_FALLBACK =
    "I couldn't find many unwatched matches for this request — you've likely already watched most of what fit your taste here.";

  private static readonly EXHAUSTION_NOTICE_MARKERS = [
    /almost everything/i,
    /already watched/i,
    /watched most/i,
    /histórico/i,
    /já assist/i,
    /quase tudo/i,
  ];

  static buildExclusionContextMessage(
    entries: ExcludeWatchedContextEntry[],
  ): string {
    if (entries.length === 0) {
      return "";
    }

    const lines = entries.map((entry) => {
      const tmdbPart =
        entry.tmdbId !== undefined ? ` (tmdbId: ${entry.tmdbId})` : "";
      const statusPart = entry.watched ? " — já assistido" : " — já sugerido";
      return `- ${entry.title}${tmdbPart}${statusPart}`;
    });

    return [
      "Contexto interno: nas rodadas anteriores estes títulos já foram sugeridos ou identificados como assistidos. Não repita nenhum deles:",
      ...lines,
    ].join("\n");
  }

  static mergeExclusionEntries(
    movies: MovieRecommendationEntity["movies"],
    watchedTmdbIds: ReadonlySet<number>,
    existingEntries: ExcludeWatchedContextEntry[],
  ): ExcludeWatchedContextEntry[] {
    const entryByKey =
      ExcludeWatchedRecommendationSanitizer.seedExclusionEntryMap(
        existingEntries,
      );

    for (const movie of movies) {
      const tmdbId = movie.tmdbId;
      const isWatched =
        ExcludeWatchedRecommendationSanitizer.isMovieWatchedForContext(
          tmdbId,
          watchedTmdbIds,
        );
      const entry: ExcludeWatchedContextEntry = {
        title: movie.title,
        tmdbId,
        watched: isWatched,
      };
      ExcludeWatchedRecommendationSanitizer.upsertExclusionEntry(
        entryByKey,
        entry,
      );
    }

    return Array.from(entryByKey.values());
  }

  private static hasVerifiedTmdbId(tmdbId: number | undefined): tmdbId is number {
    return tmdbId !== undefined && tmdbId > 0;
  }

  private static shouldKeepMovie(
    tmdbId: number | undefined,
    watchedTmdbIds: ReadonlySet<number>,
  ): boolean {
    if (tmdbId === undefined) {
      return true;
    }

    return !watchedTmdbIds.has(tmdbId);
  }

  private static isMovieWatchedForContext(
    tmdbId: number | undefined,
    watchedTmdbIds: ReadonlySet<number>,
  ): boolean {
    if (!ExcludeWatchedRecommendationSanitizer.hasVerifiedTmdbId(tmdbId)) {
      return false;
    }

    return watchedTmdbIds.has(tmdbId);
  }

  private static seedExclusionEntryMap(
    existingEntries: ExcludeWatchedContextEntry[],
  ): Map<string, ExcludeWatchedContextEntry> {
    const entryByKey = new Map<string, ExcludeWatchedContextEntry>();

    for (const entry of existingEntries) {
      const key = ExcludeWatchedRecommendationSanitizer.entryKey(entry);
      entryByKey.set(key, entry);
    }

    return entryByKey;
  }

  private static upsertExclusionEntry(
    entryByKey: Map<string, ExcludeWatchedContextEntry>,
    entry: ExcludeWatchedContextEntry,
  ): void {
    const key = ExcludeWatchedRecommendationSanitizer.entryKey(entry);
    const previousEntry = entryByKey.get(key);

    if (!previousEntry) {
      entryByKey.set(key, entry);
      return;
    }

    const shouldMarkWatched = previousEntry.watched || entry.watched;
    entryByKey.set(key, { ...previousEntry, watched: shouldMarkWatched });
  }

  private static entryKey(entry: ExcludeWatchedContextEntry): string {
    if (entry.tmdbId !== undefined && entry.tmdbId > 0) {
      return `tmdb:${entry.tmdbId}`;
    }

    return `title:${entry.title}`;
  }
}
