import { describe, it, expect } from "vitest";
import { MovieCatalogImdbConflictException } from "../movie-catalog-imdb-conflict.exception";

describe("MovieCatalogImdbConflictException", () => {
  it("expõe status 409 e mensagem com imdbId e language", () => {
    const exception = new MovieCatalogImdbConflictException("tt0816692", "pt-BR");

    expect(exception.statusCode).toBe(409);
    expect(exception.message).toBe(
      'Movie catalog entry with imdbId "tt0816692" already exists for language "pt-BR"',
    );
  });
});
