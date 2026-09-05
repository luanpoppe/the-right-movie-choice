import { BaseException } from "@/core/exceptions/base.exception";

export class MovieCatalogImdbConflictException extends BaseException {
  statusCode = 409;

  constructor(imdbId: string, language: string) {
    super(
      `Movie catalog entry with imdbId "${imdbId}" already exists for language "${language}"`,
    );
  }
}
