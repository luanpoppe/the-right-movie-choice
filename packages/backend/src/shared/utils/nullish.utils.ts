export class NullishUtils {
  static isNullish(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  }

  static isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
  }
}
