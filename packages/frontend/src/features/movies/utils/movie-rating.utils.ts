export class MovieRatingUtils {
  static format(value: number | null | undefined): string | null {
    const isMissing = value === null || value === undefined;
    if (isMissing) {
      return null;
    }

    const isFiniteNumber = Number.isFinite(value);
    if (!isFiniteNumber) {
      return null;
    }

    return value.toFixed(1);
  }
}
