import { describe, expect, it } from "vitest";
import { MovieCatalogPersistConstants } from "../movie-catalog-persist.constants";

describe("MovieCatalogPersistConstants", () => {
  describe("jobId", () => {
    it("combina tmdbId e language com dois-pontos", () => {
      const tmdbId = 157336;
      const language = "pt-BR";

      const jobId = MovieCatalogPersistConstants.jobId(tmdbId, language);

      expect(jobId).toBe("157336:pt-BR");
    });

    it("não valida language vazio", () => {
      const tmdbId = 157336;
      const language = "";

      const jobId = MovieCatalogPersistConstants.jobId(tmdbId, language);

      expect(jobId).toBe("157336:");
    });
  });

  it("expõe nome da fila catalog-movie-persist", () => {
    expect(MovieCatalogPersistConstants.QUEUE_NAME).toBe("catalog-movie-persist");
  });

  it("define uma tentativa a mais que o número de backoffs", () => {
    const backoffCount = MovieCatalogPersistConstants.BACKOFF_DELAYS_MS.length;

    expect(MovieCatalogPersistConstants.MAX_ATTEMPTS).toBe(backoffCount + 1);
    expect(MovieCatalogPersistConstants.MAX_ATTEMPTS).toBe(4);
  });

  it("define backoff de 15s, 1min e 5min", () => {
    expect(MovieCatalogPersistConstants.BACKOFF_DELAYS_MS).toEqual([
      15_000,
      60_000,
      300_000,
    ]);
  });

  it("processa até 3 jobs em paralelo", () => {
    expect(MovieCatalogPersistConstants.CONCURRENCY).toBe(3);
  });

  it("retém os últimos 500 jobs failed", () => {
    expect(MovieCatalogPersistConstants.REMOVE_ON_FAIL_COUNT).toBe(500);
  });
});
