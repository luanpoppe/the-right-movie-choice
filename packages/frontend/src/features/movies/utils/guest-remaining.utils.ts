import { StringUtils } from "@/utils/string.utils";

type HeaderMap = {
  get?: (name: string) => unknown;
};

export class GuestRemainingUtils {
  static readonly RESPONSE_HEADER_REMAINING = "X-Guest-Remaining";

  static parseFromHeaders(headers: unknown): number | null {
    const rawValue = this.readRawHeader(headers);
    if (StringUtils.isEmptyString(rawValue)) {
      return null;
    }

    const trimmedValue = rawValue.trim();
    const parsedValue = Number.parseInt(trimmedValue, 10);
    const isExactInteger = String(parsedValue) === trimmedValue;
    if (!isExactInteger) {
      return null;
    }

    return parsedValue;
  }

  private static readRawHeader(headers: unknown): string | null {
    if (headers == null || typeof headers !== "object") {
      return null;
    }

    const remainingHeaderName = GuestRemainingUtils.RESPONSE_HEADER_REMAINING;
    const remainingHeaderNameLower = remainingHeaderName.toLowerCase();

    const headerMap = headers as HeaderMap;
    const getHeader = headerMap.get;
    if (typeof getHeader === "function") {
      const fromGet = getHeader.call(headerMap, remainingHeaderName);

      const getAsString = this.toHeaderString(fromGet);
      if (getAsString != null) return getAsString;
    }

    const record = headers as Record<string, unknown>;
    const canonical = this.toHeaderString(record[remainingHeaderName]);

    if (canonical != null) return canonical;

    const lowercase = this.toHeaderString(record[remainingHeaderNameLower]);
    return lowercase;
  }

  private static toHeaderString(value: unknown): string | null {
    if (typeof value === "string") {
      return value;
    }

    const isStringArray = Array.isArray(value) && typeof value[0] === "string";
    if (isStringArray) {
      return value[0];
    }

    return null;
  }
}
