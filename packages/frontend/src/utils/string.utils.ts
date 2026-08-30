export class StringUtils {
  static isEmptyString(
    value: string | null | undefined,
  ): value is null | undefined | "" {
    if (value == null) {
      return true;
    }

    return value.length === 0;
  }
}
