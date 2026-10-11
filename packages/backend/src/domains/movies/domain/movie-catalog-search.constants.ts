import { BaseException } from "@/core/exceptions/base.exception";

export class MovieCatalogSearchValidationException extends BaseException {
  statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class MovieCatalogSearchConstants {
  static readonly ALLOWED_LANGUAGES = ["en-US", "pt-BR"] as const;
  static readonly DEFAULT_LANGUAGE = "en-US";

  static resolveLanguage(language?: string): string {
    const isMissing = language === undefined;
    if (isMissing) {
      return MovieCatalogSearchConstants.DEFAULT_LANGUAGE;
    }

    const trimmedLanguage = language.trim();
    const isBlank = trimmedLanguage === "";
    if (isBlank) {
      return MovieCatalogSearchConstants.DEFAULT_LANGUAGE;
    }

    const isAllowed = MovieCatalogSearchConstants.ALLOWED_LANGUAGES.includes(
      trimmedLanguage as (typeof MovieCatalogSearchConstants.ALLOWED_LANGUAGES)[number],
    );
    if (!isAllowed) {
      const allowedList = MovieCatalogSearchConstants.ALLOWED_LANGUAGES.join(", ");
      const message = `Invalid catalog search language "${trimmedLanguage}". Allowed: ${allowedList}.`;
      throw new MovieCatalogSearchValidationException(message);
    }

    return trimmedLanguage;
  }
}
