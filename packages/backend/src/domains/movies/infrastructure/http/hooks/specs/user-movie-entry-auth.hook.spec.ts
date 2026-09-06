import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyRequest } from "fastify";
import { IAccessTokenProvider } from "@/modules/auth/application/providers/access-token.provider";
import { InvalidAccessTokenException } from "@/domains/movies/domain/exceptions/invalid-access-token.exception";
import { UserMovieEntryAuthHook } from "../user-movie-entry-auth.hook";

describe("UserMovieEntryAuthHook", () => {
  let accessTokenProvider: IAccessTokenProvider;
  let preHandler: ReturnType<typeof UserMovieEntryAuthHook.createPreHandler>;

  beforeEach(() => {
    accessTokenProvider = {
      sign: vi.fn(),
      verify: vi.fn(),
    };

    preHandler = UserMovieEntryAuthHook.createPreHandler({
      accessTokenProvider,
    });
  });

  function createRequest(overrides: {
    authorization?: string;
  }): FastifyRequest {
    return {
      headers: {
        authorization: overrides.authorization,
      },
    } as FastifyRequest;
  }

  it("sets userMovieEntryAuth when Bearer is valid", async () => {
    vi.mocked(accessTokenProvider.verify).mockResolvedValue({ userId: 42 });
    const request = createRequest({
      authorization: "Bearer valid-token",
    });

    await preHandler(request);

    expect(request.userMovieEntryAuth).toEqual({ userId: 42 });
    expect(accessTokenProvider.verify).toHaveBeenCalledWith("valid-token");
  });

  it("throws InvalidAccessTokenException when Authorization is absent", async () => {
    const request = createRequest({});

    await expect(preHandler(request)).rejects.toBeInstanceOf(
      InvalidAccessTokenException,
    );
    expect(accessTokenProvider.verify).not.toHaveBeenCalled();
    expect(request.userMovieEntryAuth).toBeUndefined();
  });

  it("throws InvalidAccessTokenException when Authorization has no Bearer token", async () => {
    const request = createRequest({
      authorization: "Basic credentials",
    });

    await expect(preHandler(request)).rejects.toBeInstanceOf(
      InvalidAccessTokenException,
    );
    expect(accessTokenProvider.verify).not.toHaveBeenCalled();
    expect(request.userMovieEntryAuth).toBeUndefined();
  });

  it("throws InvalidAccessTokenException when Bearer is invalid or expired", async () => {
    vi.mocked(accessTokenProvider.verify).mockRejectedValue(
      new Error("jwt expired"),
    );
    const request = createRequest({
      authorization: "Bearer expired-token",
    });

    await expect(preHandler(request)).rejects.toBeInstanceOf(
      InvalidAccessTokenException,
    );
    expect(accessTokenProvider.verify).toHaveBeenCalledWith("expired-token");
    expect(request.userMovieEntryAuth).toBeUndefined();
  });
});
