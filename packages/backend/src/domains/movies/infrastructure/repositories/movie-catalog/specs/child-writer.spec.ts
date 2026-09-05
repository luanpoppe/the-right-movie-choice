import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MovieCatalogDetails } from "../../../../domain/entities/movie-catalog-details.entity";
import {
  MovieCatalogChildWriter,
  type MovieCatalogChildWriterTx,
} from "../child-writer";

class ChildWriterFixtures {
  static interestelarV1(): MovieCatalogDetails {
    return {
      tmdbId: 157336,
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Em busca de um novo lar.",
      runtimeMinutes: 169,
      genres: ["Ficção científica", "Drama"],
      tmdbVoteAverage: 8.4,
      originCountries: ["US"],
      directors: ["Christopher Nolan"],
      cast: ["Matthew McConaughey"],
      watchProviders: {
        flatrate: [{ providerName: "Netflix", logoPath: "/netflix.png" }],
        rent: [],
        buy: [],
      },
      imdbId: "tt0816692",
    };
  }

  static interestelarV2AnneOnly(): MovieCatalogDetails {
    return {
      ...ChildWriterFixtures.interestelarV1(),
      cast: ["Anne Hathaway"],
      watchProviders: {
        flatrate: [],
        rent: [],
        buy: [],
      },
    };
  }
}

describe("MovieCatalogChildWriter", () => {
  const movieId = 99;
  let tx: {
    movieGenre: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> };
    movieDirector: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> };
    movieCast: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> };
    movieOriginCountry: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> };
    movieWatchProvider: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    tx = {
      movieGenre: { deleteMany: vi.fn(), createMany: vi.fn() },
      movieDirector: { deleteMany: vi.fn(), createMany: vi.fn() },
      movieCast: { deleteMany: vi.fn(), createMany: vi.fn() },
      movieOriginCountry: { deleteMany: vi.fn(), createMany: vi.fn() },
      movieWatchProvider: { deleteMany: vi.fn(), createMany: vi.fn() },
    };
  });

  it("apaga todas as filhas antes de recriar o lote REQ-1", async () => {
    const details = ChildWriterFixtures.interestelarV1();

    await MovieCatalogChildWriter.replaceAll(
      tx as unknown as MovieCatalogChildWriterTx,
      movieId,
      details,
    );

    expect(tx.movieGenre.deleteMany).toHaveBeenCalledWith({ where: { movieId } });
    expect(tx.movieDirector.deleteMany).toHaveBeenCalledWith({ where: { movieId } });
    expect(tx.movieCast.deleteMany).toHaveBeenCalledWith({ where: { movieId } });
    expect(tx.movieOriginCountry.deleteMany).toHaveBeenCalledWith({
      where: { movieId },
    });
    expect(tx.movieWatchProvider.deleteMany).toHaveBeenCalledWith({
      where: { movieId },
    });
    expect(tx.movieCast.createMany).toHaveBeenCalledWith({
      data: [{ movieId, name: "Matthew McConaughey", sortOrder: 0 }],
    });
    expect(tx.movieWatchProvider.createMany).toHaveBeenCalledWith({
      data: [
        {
          movieId,
          kind: "flatrate",
          providerName: "Netflix",
          logoPath: "/netflix.png",
        },
      ],
    });
  });

  it("segundo replaceAll grava só Anne Hathaway e sem flatrate REQ-2", async () => {
    const firstDetails = ChildWriterFixtures.interestelarV1();
    const secondDetails = ChildWriterFixtures.interestelarV2AnneOnly();

    await MovieCatalogChildWriter.replaceAll(
      tx as unknown as MovieCatalogChildWriterTx,
      movieId,
      firstDetails,
    );
    await MovieCatalogChildWriter.replaceAll(
      tx as unknown as MovieCatalogChildWriterTx,
      movieId,
      secondDetails,
    );

    const secondCastCall = tx.movieCast.createMany.mock.calls[1]?.[0];
    const secondWatchCall = tx.movieWatchProvider.createMany.mock.calls[1];

    expect(secondCastCall).toEqual({
      data: [{ movieId, name: "Anne Hathaway", sortOrder: 0 }],
    });
    expect(secondWatchCall).toBeUndefined();
  });

  it("não chama createMany quando uma lista de filhos está vazia", async () => {
    const details = ChildWriterFixtures.interestelarV2AnneOnly();

    await MovieCatalogChildWriter.replaceAll(
      tx as unknown as MovieCatalogChildWriterTx,
      movieId,
      details,
    );

    expect(tx.movieWatchProvider.createMany).not.toHaveBeenCalled();
  });
});
