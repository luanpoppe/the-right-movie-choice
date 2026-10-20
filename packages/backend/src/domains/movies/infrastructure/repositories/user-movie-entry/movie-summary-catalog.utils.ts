import type { UserMovieEntryMovieSummary } from "../../../domain/entities/user-movie-entry.entity";
import { DEFAULT_MOVIE_CATALOG_LANGUAGE } from "../../../domain/repositories/movie-catalog.repository";

export type UserMovieEntryCatalogRow = {
  tmdbId: number;
  language: string;
  title: string;
  year: number | null;
  posterPath: string | null;
  tmdbVoteAverage: number | null;
};

export class UserMovieEntryCatalogSummaryUtils {
  static buildPreferredByTmdbId(
    rows: UserMovieEntryCatalogRow[],
  ): Map<number, UserMovieEntryMovieSummary> {
    const summariesByTmdbId = new Map<number, UserMovieEntryMovieSummary>();

    UserMovieEntryCatalogSummaryUtils.applyFallbackRows(
      summariesByTmdbId,
      rows,
    );
    UserMovieEntryCatalogSummaryUtils.applyPreferredRows(
      summariesByTmdbId,
      rows,
    );

    return summariesByTmdbId;
  }

  static listLanguages(rows: UserMovieEntryCatalogRow[]): string[] {
    const languages = rows.map((row) => row.language);
    const uniqueLanguages = new Set(languages);
    return [...uniqueLanguages];
  }

  private static applyFallbackRows(
    summariesByTmdbId: Map<number, UserMovieEntryMovieSummary>,
    rows: UserMovieEntryCatalogRow[],
  ): void {
    for (const row of rows) {
      const isPreferredLanguage =
        row.language === DEFAULT_MOVIE_CATALOG_LANGUAGE;
      if (isPreferredLanguage) continue;

      const alreadyHasSummary = summariesByTmdbId.has(row.tmdbId);
      if (alreadyHasSummary) continue;

      const summary = UserMovieEntryCatalogSummaryUtils.toSummary(row);
      summariesByTmdbId.set(row.tmdbId, summary);
    }
  }

  private static applyPreferredRows(
    summariesByTmdbId: Map<number, UserMovieEntryMovieSummary>,
    rows: UserMovieEntryCatalogRow[],
  ): void {
    for (const row of rows) {
      const isPreferredLanguage =
        row.language === DEFAULT_MOVIE_CATALOG_LANGUAGE;
      if (!isPreferredLanguage) continue;

      const summary = UserMovieEntryCatalogSummaryUtils.toSummary(row);
      summariesByTmdbId.set(row.tmdbId, summary);
    }
  }

  private static toSummary(
    row: UserMovieEntryCatalogRow,
  ): UserMovieEntryMovieSummary {
    const summary: UserMovieEntryMovieSummary = {
      title: row.title,
      year: row.year,
      posterPath: row.posterPath,
      voteAverage: row.tmdbVoteAverage,
    };
    return summary;
  }
}
