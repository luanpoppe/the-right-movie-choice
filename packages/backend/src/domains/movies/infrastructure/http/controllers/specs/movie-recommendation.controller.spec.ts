import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import { GuestQuotaService } from "@/domains/movies/application/guest-quota.service";
import { GuestQuotaConstants } from "@/domains/movies/domain/guest-quota.constants";
import { SingleMovieReccomendationInternalEntity } from "@/domains/movies/domain/entities/movie-recommendation.entity";
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
}): FastifyRequest<{
  Body: MovieRecommendationRequest;
  Headers: { chatid: string };
}> {
  return {
    body: { userMessage: "recommend a sci-fi movie" },
    headers: { chatid: "chat-123" },
    movieAuth: overrides?.movieAuth,
  } as FastifyRequest<{
    Body: MovieRecommendationRequest;
    Headers: { chatid: string };
  }>;
}

describe("MovieRecommendationController", () => {
  let guestQuotaService: GuestQuotaService;
  let handler: ReturnType<typeof MovieRecommendationController.create>;

  beforeEach(() => {
    mockExecute.mockReset();
    guestQuotaService = {
      incrementAfterSuccess: vi.fn(),
    } as unknown as GuestQuotaService;
    handler = MovieRecommendationController.create(guestQuotaService);
  });

  it("strips tmdbId and imdbId from movies in the authenticated response", async () => {
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
    expect(Object.keys(sentBody.movies[0]!)).not.toContain("tmdbId");
    expect(Object.keys(sentBody.movies[0]!)).not.toContain("imdbId");
    expect(JSON.stringify(sentBody.movies[0])).not.toContain("tmdbId");
    expect(JSON.stringify(sentBody.movies[0])).not.toContain("imdbId");
    expect(
      guestQuotaService.incrementAfterSuccess,
    ).not.toHaveBeenCalled();
  });

  it("strips internal ids on the anonymous guest path and keeps quota side effects", async () => {
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
    expect(Object.keys(sentBody.movies[0]!)).not.toContain("tmdbId");
    expect(Object.keys(sentBody.movies[0]!)).not.toContain("imdbId");
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

    expect(Object.keys(sentBody.movies[0]!)).not.toContain("tmdbId");
    expect(Object.keys(sentBody.movies[0]!)).not.toContain("imdbId");
    expect(Object.keys(sentBody.movies[0]!)).not.toContain("catalogLookupIndex");
    expect(Object.keys(sentBody.movies[0]!)).not.toContain("foundInCatalog");
    expect(sentBody.movies[0]).toMatchObject({
      title: INTERNAL_MOVIE.title,
      director: INTERNAL_MOVIE.director,
      releaseYear: INTERNAL_MOVIE.releaseYear,
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
