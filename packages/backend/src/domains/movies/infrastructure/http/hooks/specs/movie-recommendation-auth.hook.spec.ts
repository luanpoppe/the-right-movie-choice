import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyRequest } from "fastify";
import { IAccessTokenProvider } from "@/modules/auth/application/providers/access-token.provider";
import { GuestQuotaService } from "@/domains/movies/application/guest-quota.service";
import { GuestQuotaExceededException } from "@/domains/movies/domain/exceptions/guest-quota-exceeded.exception";
import { GuestQuotaConstants } from "@/domains/movies/domain/guest-quota.constants";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import { MovieRecommendationAuthHook } from "../movie-recommendation-auth.hook";

describe("MovieRecommendationAuthHook", () => {
  let accessTokenProvider: IAccessTokenProvider;
  let guestQuotaService: GuestQuotaService;
  let preHandler: ReturnType<
    typeof MovieRecommendationAuthHook.createPreHandler
  >;

  beforeEach(() => {
    accessTokenProvider = {
      sign: vi.fn(),
      verify: vi.fn(),
    };
    guestQuotaService = {
      getRemaining: vi.fn(),
      assertCanAcceptAnonymousRecommendation: vi.fn(),
      incrementAfterSuccess: vi.fn(),
    } as unknown as GuestQuotaService;

    preHandler = MovieRecommendationAuthHook.createPreHandler({
      accessTokenProvider,
      guestQuotaService,
    });
  });

  function createRequest(overrides: {
    authorization?: string;
    cookies?: Record<string, string | undefined>;
  }): FastifyRequest {
    return {
      headers: {
        authorization: overrides.authorization,
      },
      cookies: overrides.cookies ?? {},
    } as FastifyRequest;
  }

  it("marks authenticated and does not assert quota when Bearer is valid", async () => {
    vi.mocked(accessTokenProvider.verify).mockResolvedValue({ userId: 42 });
    const request = createRequest({
      authorization: "Bearer valid-token",
    });

    await preHandler(request);

    expect(request.movieAuth).toEqual({
      kind: "authenticated",
      userId: 42,
    });
    expect(accessTokenProvider.verify).toHaveBeenCalledWith("valid-token");
    expect(
      guestQuotaService.assertCanAcceptAnonymousRecommendation,
    ).not.toHaveBeenCalled();
  });

  it("throws InvalidAccessTokenException and does not assert quota when Bearer is invalid", async () => {
    vi.mocked(accessTokenProvider.verify).mockRejectedValue(
      new Error("jwt expired"),
    );
    const request = createRequest({
      authorization: "Bearer expired-token",
    });

    await expect(preHandler(request)).rejects.toBeInstanceOf(
      InvalidAccessTokenException,
    );
    expect(
      guestQuotaService.assertCanAcceptAnonymousRecommendation,
    ).not.toHaveBeenCalled();
  });

  it("asserts quota with cookie guest-id when Authorization is absent", async () => {
    vi.mocked(
      guestQuotaService.assertCanAcceptAnonymousRecommendation,
    ).mockResolvedValue(undefined);
    const request = createRequest({
      cookies: { [GuestQuotaConstants.COOKIE_NAME]: "cookie-guest-id" },
    });

    await preHandler(request);

    expect(
      guestQuotaService.assertCanAcceptAnonymousRecommendation,
    ).toHaveBeenCalledWith("cookie-guest-id");
    expect(request.movieAuth).toEqual({
      kind: "anonymous",
      guestId: "cookie-guest-id",
    });
    expect(accessTokenProvider.verify).not.toHaveBeenCalled();
  });

  it("asserts quota with a generated UUID when cookie is absent", async () => {
    vi.mocked(
      guestQuotaService.assertCanAcceptAnonymousRecommendation,
    ).mockResolvedValue(undefined);
    const request = createRequest({ cookies: {} });

    await preHandler(request);

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(
      guestQuotaService.assertCanAcceptAnonymousRecommendation,
    ).toHaveBeenCalledWith(expect.stringMatching(uuidPattern));

    const isAnonymous = request.movieAuth?.kind === "anonymous";
    expect(isAnonymous).toBe(true);
    if (request.movieAuth?.kind !== "anonymous") return;

    expect(request.movieAuth.guestId).toMatch(uuidPattern);
  });

  it("propagates GuestQuotaExceededException when quota is exceeded", async () => {
    vi.mocked(
      guestQuotaService.assertCanAcceptAnonymousRecommendation,
    ).mockRejectedValue(new GuestQuotaExceededException());
    const request = createRequest({
      cookies: { [GuestQuotaConstants.COOKIE_NAME]: "quota-full-guest" },
    });

    await expect(preHandler(request)).rejects.toBeInstanceOf(
      GuestQuotaExceededException,
    );
  });
});
