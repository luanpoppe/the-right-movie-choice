import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaUtil } from "@/shared/utils/prisma.util";
import type { MovieCatalogDetails } from "../../../../domain/entities/movie-catalog-details.entity";
import { MovieCatalogImdbConflictException } from "../../../../domain/exceptions/movie-catalog-imdb-conflict.exception";
import {
  DEFAULT_MOVIE_CATALOG_LANGUAGE,
} from "../../../../domain/repositories/movie-catalog.repository";
import { MovieWatchProviderKind } from "../../../../../../../generated/prisma/client.js";
import { MovieCatalogChildWriter } from "../child-writer";
import { PrismaMovieCatalogRepository } from "../prisma-movie-catalog.repository";

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    movie: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../child-writer", () => ({
  MovieCatalogChildWriter: {
    replaceAll: vi.fn(),
  },
}));

const MOVIE_CATALOG_CHILDREN_INCLUDE = {
  genres: true,
  directors: true,
  cast: true,
  originCountries: true,
  watchProviders: true,
};

class MovieCatalogRepositoryFixtures {
  static interestelarV1(
    overrides: Partial<MovieCatalogDetails> = {},
  ): MovieCatalogDetails {
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
      ...overrides,
    };
  }

  static interestelarV2AnneOnly(): MovieCatalogDetails {
    return {
      ...MovieCatalogRepositoryFixtures.interestelarV1(),
      cast: ["Anne Hathaway"],
      watchProviders: {
        flatrate: [],
        rent: [],
        buy: [],
      },
    };
  }

  static prismaRowWithChildren(overrides: Record<string, unknown> = {}) {
    return {
      id: 42,
      tmdbId: 157336,
      language: "pt-BR",
      title: "Interestelar",
      year: 2014,
      posterPath: "/poster.jpg",
      overview: "Em busca de um novo lar.",
      runtimeMinutes: 169,
      tmdbVoteAverage: 8.4,
      imdbId: "tt0816692",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      genres: [{ id: 1, name: "Ficção científica", movieId: 42 }],
      directors: [{ id: 1, name: "Christopher Nolan", movieId: 42 }],
      cast: [{ id: 1, name: "Matthew McConaughey", sortOrder: 0, movieId: 42 }],
      originCountries: [{ id: 1, code: "US", movieId: 42 }],
      watchProviders: [
        {
          id: 1,
          kind: MovieWatchProviderKind.flatrate,
          providerName: "Netflix",
          logoPath: "/netflix.png",
          movieId: 42,
        },
      ],
      ...overrides,
    };
  }
}

describe("PrismaMovieCatalogRepository", () => {
  let repository: PrismaMovieCatalogRepository;
  let movieUpsert: ReturnType<typeof vi.fn>;
  let transactionClient: {
    movie: { upsert: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaMovieCatalogRepository();
    movieUpsert = vi.fn();
    transactionClient = {
      movie: { upsert: movieUpsert },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return callback(transactionClient as never);
    });
    movieUpsert.mockResolvedValue({ id: 42, tmdbId: 157336 });
    vi.mocked(MovieCatalogChildWriter.replaceAll).mockResolvedValue(undefined);
  });

  describe("upsert", () => {
    it("REQ-1 grava Interestelar com language omitido default pt-BR e substitui filhas", async () => {
      const details = MovieCatalogRepositoryFixtures.interestelarV1();

      await repository.upsert(details);

      expect(movieUpsert).toHaveBeenCalledWith({
        where: {
          tmdbId_language: {
            tmdbId: 157336,
            language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
          },
        },
        create: {
          tmdbId: 157336,
          language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
          title: "Interestelar",
          year: 2014,
          posterPath: "/poster.jpg",
          overview: "Em busca de um novo lar.",
          runtimeMinutes: 169,
          tmdbVoteAverage: 8.4,
          imdbId: "tt0816692",
        },
        update: {
          tmdbId: 157336,
          language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
          title: "Interestelar",
          year: 2014,
          posterPath: "/poster.jpg",
          overview: "Em busca de um novo lar.",
          runtimeMinutes: 169,
          tmdbVoteAverage: 8.4,
          imdbId: "tt0816692",
        },
      });
      expect(MovieCatalogChildWriter.replaceAll).toHaveBeenCalledWith(
        transactionClient,
        42,
        details,
      );
      expect(Logger.info).toHaveBeenCalledWith("Movie catalog upsert ok", {
        tmdbId: 157336,
        language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
        movieId: 42,
      });
    });

    it("REQ-1 erro grava mesmo com imdbId null no payload", async () => {
      const details = MovieCatalogRepositoryFixtures.interestelarV1({
        imdbId: null,
      });

      await repository.upsert(details);

      const upsertArgs = movieUpsert.mock.calls[0]?.[0];
      expect(upsertArgs?.create.imdbId).toBeNull();
      expect(upsertArgs?.update.imdbId).toBeNull();
    });

    it("REQ-2 segundo upsert do mesmo par chama replaceAll com elenco Anne Hathaway e sem flatrate", async () => {
      const firstDetails = MovieCatalogRepositoryFixtures.interestelarV1();
      const secondDetails = MovieCatalogRepositoryFixtures.interestelarV2AnneOnly();

      await repository.upsert(firstDetails);
      await repository.upsert(secondDetails);

      expect(MovieCatalogChildWriter.replaceAll).toHaveBeenCalledTimes(2);
      expect(MovieCatalogChildWriter.replaceAll).toHaveBeenLastCalledWith(
        transactionClient,
        42,
        secondDetails,
      );
    });

    it("edge mesmo tmdbId em en-US usa chave unique distinta de pt-BR", async () => {
      const details = MovieCatalogRepositoryFixtures.interestelarV1();

      await repository.upsert(details, "en-US");

      expect(movieUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tmdbId_language: {
              tmdbId: 157336,
              language: "en-US",
            },
          },
          create: expect.objectContaining({ language: "en-US" }),
        }),
      );
    });

    it("P2002 lança MovieCatalogImdbConflictException com imdbId e language", async () => {
      const details = MovieCatalogRepositoryFixtures.interestelarV1();
      const prismaError = { code: PrismaUtil.UNIQUE_CONSTRAINT_CODE };
      vi.mocked(prisma.$transaction).mockRejectedValue(prismaError);

      await expect(repository.upsert(details)).rejects.toThrow(
        MovieCatalogImdbConflictException,
      );
      await expect(repository.upsert(details)).rejects.toThrow(
        'Movie catalog entry with imdbId "tt0816692" already exists for language "pt-BR"',
      );
      expect(Logger.error).toHaveBeenCalledWith("Movie catalog upsert failed", {
        tmdbId: 157336,
        language: DEFAULT_MOVIE_CATALOG_LANGUAGE,
      });
    });

    it("repropaga erro que não é violação unique", async () => {
      const details = MovieCatalogRepositoryFixtures.interestelarV1();
      const connectionError = new Error("connection failed");
      vi.mocked(prisma.$transaction).mockRejectedValue(connectionError);

      await expect(repository.upsert(details)).rejects.toThrow(connectionError);
    });
  });

  describe("findByTmdbId", () => {
    it("REQ-3 retorna MovieCatalogDetails quando existe linha pt-BR", async () => {
      const row = MovieCatalogRepositoryFixtures.prismaRowWithChildren();
      vi.mocked(prisma.movie.findFirst).mockResolvedValue(row as never);

      const result = await repository.findByTmdbId(157336, "pt-BR");

      expect(prisma.movie.findFirst).toHaveBeenCalledWith({
        where: { tmdbId: 157336, language: "pt-BR" },
        include: MOVIE_CATALOG_CHILDREN_INCLUDE,
        orderBy: { updatedAt: "desc" },
      });
      expect(result?.details.tmdbId).toBe(157336);
      expect(result?.details.tmdbId).not.toBe(row.id);
      expect(result?.details.imdbId).toBe("tt0816692");
      expect(result?.updatedAt).toEqual(new Date("2026-01-02T00:00:00.000Z"));
      expect(Logger.debug).toHaveBeenCalledWith("Movie catalog find by tmdbId hit", {
        tmdbId: 157336,
        language: "pt-BR",
      });
    });

    it("REQ-3 retorna null quando não há linha", async () => {
      vi.mocked(prisma.movie.findFirst).mockResolvedValue(null);

      const result = await repository.findByTmdbId(157336, "pt-BR");

      expect(result).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith("Movie catalog find by tmdbId miss", {
        tmdbId: 157336,
        language: "pt-BR",
      });
    });

    it("edge usa DEFAULT_MOVIE_CATALOG_LANGUAGE quando language omitido", async () => {
      vi.mocked(prisma.movie.findFirst).mockResolvedValue(null);

      await repository.findByTmdbId(157336);

      expect(prisma.movie.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tmdbId: 157336, language: DEFAULT_MOVIE_CATALOG_LANGUAGE },
        }),
      );
    });
  });

  describe("findByTitleAndYear", () => {
    it("REQ-4 busca trecho de título sem acento com year e language pt-BR", async () => {
      const row = MovieCatalogRepositoryFixtures.prismaRowWithChildren({
        title: "O Senhor dos Anéis",
      });
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: 42 }]);
      vi.mocked(prisma.movie.findFirst).mockResolvedValue(row as never);

      const result = await repository.findByTitleAndYear(
        "Senhor dos Aneis",
        2014,
        "pt-BR",
      );

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.movie.findFirst).toHaveBeenCalledWith({
        where: { id: 42 },
        include: MOVIE_CATALOG_CHILDREN_INCLUDE,
      });
      expect(result?.details.title).toBe("O Senhor dos Anéis");
      expect(result?.details.year).toBe(2014);
      expect(result?.updatedAt).toEqual(new Date("2026-01-02T00:00:00.000Z"));
    });

    it("REQ-4 erro year omitido ainda busca por trecho e pede o id mais recente no SQL", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      await repository.findByTitleAndYear("Senhor", undefined, "pt-BR");

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.movie.findFirst).not.toHaveBeenCalled();
    });

    it("edge usa DEFAULT_MOVIE_CATALOG_LANGUAGE quando language omitido", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      await repository.findByTitleAndYear("interestelar", 2014);

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("título vazio não consulta o banco", async () => {
      const result = await repository.findByTitleAndYear("", 2014, "pt-BR");

      expect(result).toBeNull();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
