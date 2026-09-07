import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import { GuestQuotaService } from "@/domains/movies/application/guest-quota.service";
import { GuestQuotaConstants } from "@/domains/movies/domain/guest-quota.constants";
import { SingleMovieReccomendationInternalEntity } from "@/domains/movies/domain/entities/movie-recommendation.entity";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { MovieRecommendationRequest } from "../../dto/movie-recommendation.dto";
import { MovieRecommendationController } from "../movie-recommendation.controller";

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}));

vi.mock(
  "../../../factories/make-get-movie-recommendation-use-case.factory",
  () => ({
    MakeGetMovieRecommendationUseCaseFactory: {
      create: vi.fn(() => ({
        execute: mockExecute,
      })),
    },
  }),
);

const INTERNAL_MOVIE: SingleMovieReccomendationInternalEntity = {
  title: "Inception",
  director: "Christopher Nolan",
  actors: ["Leonardo DiCaprio"],
  releaseYear: 2010,
  streamingPlatform: "Netflix",
  imdbRating: 8.8,
  synopsis: "A thief who steals corporate secrets through dream-sharing technology.",
  whySuggestion: "Mind-bending plot that matches your taste.",
  durationInMinutes: 148,
  tmdbId: 27205,
  imdbId: "tt1375666",
};

function createReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setCookie: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

function createRequest(overrides?: {
  movieAuth?: FastifyRequest["movieAuth"];
  body?: Partial<MovieRecommendationRequest>;
}): FastifyRequest<{
  Body: MovieRecommendationRequest;
  Headers: { chatid: string };
}> {
  return {
    body: {
      userMessage: "recommend a sci-fi movie",
      ...overrides?.body,
    },
    headers: { chatid: "chat-123" },
    movieAuth: overrides?.movieAuth,
  } as FastifyRequest<{
    Body: MovieRecommendationRequest;
    Headers: { chatid: string };
  }>;
}

describe("MovieRecommendationController", () => {
  let guestQuotaService: GuestQuotaService;
  let catalogRepository: IMovieCatalogRepository;
  let handler: ReturnType<typeof MovieRecommendationController.create>;

  beforeEach(() => {
    mockExecute.mockReset();
    guestQuotaService = {
      incrementAfterSuccess: vi.fn(),
    } as unknown as GuestQuotaService;
    catalogRepository = {
      upsert: vi.fn(),
      findByTmdbId: vi.fn().mockResolvedValue({
        details: {
          tmdbId: INTERNAL_MOVIE.tmdbId,
          title: INTERNAL_MOVIE.title,
          year: INTERNAL_MOVIE.releaseYear,
          posterPath: "/poster.jpg",
          overview: INTERNAL_MOVIE.synopsis,
          runtimeMinutes: INTERNAL_MOVIE.durationInMinutes,
          genres: [],
          tmdbVoteAverage: INTERNAL_MOVIE.imdbRating,
          originCountries: [],
          directors: [INTERNAL_MOVIE.director],
          cast: INTERNAL_MOVIE.actors,
          watchProviders: { flatrate: [], rent: [], buy: [] },
          imdbId: INTERNAL_MOVIE.imdbId,
        },
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      findByTitleAndYear: vi.fn(),
      findByTitlesAndYears: vi.fn(),
    };
    handler = MovieRecommendationController.create({
      guestQuotaService,
      catalogRepository,
    });
  });

  it("REQ-5: autenticado sem excludeWatched no body repassa excludeWatched true ao use case", async () => {
    mockExecute.mockResolvedValue({
      movies: [INTERNAL_MOVIE],
      response: "Authenticated default exclude.",
    });
    const request = createRequest({
      movieAuth: { kind: "authenticated", userId: 42 },
    });
    const reply = createReply();

    await handler(request, reply);

    expect(mockExecute).toHaveBeenCalledWith(
      "recommend a sci-fi movie",
      "chat-123",
      {
        userId: 42,
        excludeWatched: true,
      },
    );
  });

  it("REQ-2: autenticado com excludeWatched false repassa flag ao use case", async () => {
    mockExecute.mockResolvedValue({
      movies: [INTERNAL_MOVIE],
      response: "Legacy flow.",
    });
    const request = createRequest({
      movieAuth: { kind: "authenticated", userId: 99 },
      body: { excludeWatched: false },
    });
    const reply = createReply();

    await handler(request, reply);

    expect(mockExecute).toHaveBeenCalledWith(
      "recommend a sci-fi movie",
      "chat-123",
      {
        userId: 99,
        excludeWatched: false,
      },
    );
  });

  it("REQ-3: anônimo com excludeWatched true ignora flag e não repassa userId", async () => {
    mockExecute.mockResolvedValue({
      movies: [INTERNAL_MOVIE],
      response: "Guest recommendation.",
    });
    vi.mocked(guestQuotaService.incrementAfterSuccess).mockResolvedValue(1);
    const guestId = "guest-uuid-456";
    const request = createRequest({
      movieAuth: { kind: "anonymous", guestId },
      body: { excludeWatched: true },
    });
    const reply = createReply();

    await handler(request, reply);

    expect(mockExecute).toHaveBeenCalledWith(
      "recommend a sci-fi movie",
      "chat-123",
      undefined,
    );
  });

  it("REQ-1: expõe tmdbId e imdbId na resposta autenticada quando presentes", async () => {
    mockExecute.mockResolvedValue({
      movies: [INTERNAL_MOVIE],
      response: "Here is a great pick for you.",
    });
    const request = createRequest({
      movieAuth: { kind: "authenticated", userId: 42 },
    });
    const reply = createReply();

    await handler(request, reply);

    const sentBody = vi.mocked(reply.send).mock.calls[0]?.[0] as {
      movies: Record<string, unknown>[];
      response: string;
    };

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(sentBody.response).toBe("Here is a great pick for you.");
    expect(sentBody.movies).toHaveLength(1);
    expect(sentBody.movies[0]).toMatchObject({
      tmdbId: INTERNAL_MOVIE.tmdbId,
      imdbId: INTERNAL_MOVIE.imdbId,
      posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
    });
    expect(
      guestQuotaService.incrementAfterSuccess,
    ).not.toHaveBeenCalled();
  });

  it("REQ-3: expõe os mesmos ids para guest anônimo e mantém efeitos de quota", async () => {
    mockExecute.mockResolvedValue({
      movies: [INTERNAL_MOVIE],
      response: "Guest recommendation.",
    });
    vi.mocked(guestQuotaService.incrementAfterSuccess).mockResolvedValue(1);
    const guestId = "guest-uuid-123";
    const request = createRequest({
      movieAuth: { kind: "anonymous", guestId },
    });
    const reply = createReply();

    await handler(request, reply);

    const sentBody = vi.mocked(reply.send).mock.calls[0]?.[0] as {
      movies: Record<string, unknown>[];
      response: string;
    };

    expect(guestQuotaService.incrementAfterSuccess).toHaveBeenCalledWith(
      guestId,
    );
    expect(reply.setCookie).toHaveBeenCalled();
    expect(reply.header).toHaveBeenCalledWith(
      GuestQuotaConstants.RESPONSE_HEADER_REMAINING,
      "1",
    );
    expect(sentBody.movies[0]).toMatchObject({
      tmdbId: INTERNAL_MOVIE.tmdbId,
      imdbId: INTERNAL_MOVIE.imdbId,
      posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
    });
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(sentBody);
  });

  it("REQ-3: mapeia cada filme via SingleMovieReccomendationSchema e não só destructuring do array", async () => {
    const movieWithInternalFields = {
      ...INTERNAL_MOVIE,
      catalogLookupIndex: 2,
      foundInCatalog: true,
    };
    mockExecute.mockResolvedValue({
      movies: [movieWithInternalFields],
      response: "Mapped via public schema.",
    });
    const request = createRequest({
      movieAuth: { kind: "authenticated", userId: 1 },
    });
    const reply = createReply();

    await handler(request, reply);

    const sentBody = vi.mocked(reply.send).mock.calls[0]?.[0] as {
      movies: Record<string, unknown>[];
      response: string;
    };

    expect(Object.keys(sentBody.movies[0]!)).not.toContain("catalogLookupIndex");
    expect(Object.keys(sentBody.movies[0]!)).not.toContain("foundInCatalog");
    expect(sentBody.movies[0]).toMatchObject({
      title: INTERNAL_MOVIE.title,
      director: INTERNAL_MOVIE.director,
      releaseYear: INTERNAL_MOVIE.releaseYear,
      tmdbId: INTERNAL_MOVIE.tmdbId,
      imdbId: INTERNAL_MOVIE.imdbId,
    });
  });

  it("REQ-3: devolve filme sem ids quando entidade interna omitiu tmdbId e imdbId", async () => {
    const { tmdbId: _tmdbId, imdbId: _imdbId, ...movieWithoutIds } =
      INTERNAL_MOVIE;
    mockExecute.mockResolvedValue({
      movies: [movieWithoutIds],
      response: "Recomendação sem catálogo.",
    });
    const request = createRequest({
      movieAuth: { kind: "authenticated", userId: 3 },
    });
    const reply = createReply();

    await handler(request, reply);

    const sentBody = vi.mocked(reply.send).mock.calls[0]?.[0] as {
      movies: Record<string, unknown>[];
    };

    expect(sentBody.movies[0]).not.toHaveProperty("tmdbId");
    expect(sentBody.movies[0]).not.toHaveProperty("imdbId");
    expect(sentBody.movies[0]?.posterPath).toBeNull();
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it("returns an empty movies array without error", async () => {
    mockExecute.mockResolvedValue({
      movies: [],
      response: "No movies found for that request.",
    });
    const request = createRequest({
      movieAuth: { kind: "authenticated", userId: 7 },
    });
    const reply = createReply();

    await handler(request, reply);

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      response: "No movies found for that request.",
      movies: [],
    });
  });
});
