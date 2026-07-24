import { describe, it, expect, vi, beforeEach } from "vitest";
import { RefreshAccessTokenUseCase } from "../refresh-access-token.use-case";
import { IRefreshTokenRepository } from "../../../domain/repositories/refresh-token.repository";
import { IAccessTokenProvider } from "../../providers/access-token.provider";
import { InvalidRefreshTokenException } from "../../../domain/exceptions/invalid-refresh-token.exception";

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "new-refresh-token-id"),
}));

describe("RefreshAccessTokenUseCase", () => {
  const refreshTokenTtlSeconds = 604800;

  let refreshTokenRepository: IRefreshTokenRepository;
  let accessTokenProvider: IAccessTokenProvider;
  let useCase: RefreshAccessTokenUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    refreshTokenRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findUserIdByTokenId: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    accessTokenProvider = {
      sign: vi.fn().mockResolvedValue({
        accessToken: "new-access-token",
        expiresIn: 900,
      }),
      verify: vi.fn(),
    };

    useCase = new RefreshAccessTokenUseCase(
      refreshTokenRepository,
      accessTokenProvider,
      refreshTokenTtlSeconds
    );
  });

  it("should rotate refresh token and return new access token", async () => {
    const result = await useCase.execute("old-refresh-token-id");

    expect(refreshTokenRepository.findUserIdByTokenId).toHaveBeenCalledWith(
      "old-refresh-token-id"
    );
    expect(refreshTokenRepository.delete).toHaveBeenCalledWith(
      "old-refresh-token-id"
    );
    expect(refreshTokenRepository.save).toHaveBeenCalledWith(
      "new-refresh-token-id",
      1,
      refreshTokenTtlSeconds
    );
    expect(result).toEqual({
      accessToken: "new-access-token",
      expiresIn: 900,
      refreshTokenId: "new-refresh-token-id",
    });
  });

  it("should throw InvalidRefreshTokenException when token is not found", async () => {
    vi.mocked(refreshTokenRepository.findUserIdByTokenId).mockResolvedValue(
      null
    );

    await expect(useCase.execute("invalid-token")).rejects.toBeInstanceOf(
      InvalidRefreshTokenException
    );

    expect(refreshTokenRepository.delete).not.toHaveBeenCalled();
    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
  });
});
