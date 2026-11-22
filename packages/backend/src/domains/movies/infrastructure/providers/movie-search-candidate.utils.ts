import type { MovieSearchHit } from "../../domain/entities/movie-search.entity";

export class MovieSearchCandidateUtils {
  private static readonly YEAR_TOLERANCE = 2;

  static pickBestByYear(
    hits: MovieSearchHit[],
    year?: number,
  ): MovieSearchHit | undefined {
    const firstHit = hits[0];
    if (year === undefined) {
      return firstHit;
    }

    const candidateWithinTolerance = hits.find((hit) =>
      MovieSearchCandidateUtils.isWithinYearTolerance(hit, year),
    );
    return candidateWithinTolerance ?? firstHit;
  }

  private static isWithinYearTolerance(
    hit: MovieSearchHit,
    year: number,
  ): boolean {
    const hitYear = hit.year;
    const hasHitYear = hitYear !== null;
    if (!hasHitYear) {
      return false;
    }

    const difference = Math.abs(hitYear - year);
    return difference <= MovieSearchCandidateUtils.YEAR_TOLERANCE;
  }
}
