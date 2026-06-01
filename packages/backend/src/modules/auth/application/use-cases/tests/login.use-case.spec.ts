import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { LoginUseCase } from "../login.use-case";
import { IUserCredentialsRepository } from "@/modules/users/domain/repositories/user-credentials.repository";
import { IRefreshTokenRepository } from "../../../domain/repositories/refresh-token.repository";
import { IAccessTokenProvider } from "../../providers/access-token.provider";
import { InvalidCredentialsException } from "../../../domain/exceptions/invalid-credentials.exception";

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "refresh-token-id"),
}));

describe("LoginUseCase", () => {
  const refreshTokenTtlSeconds = 604800;

  let userCredentialsRepository: IUserCredentialsRepository;
  let refreshTokenRepository: IRefreshTokenRepository;
  let accessTokenProvider: IAccessTokenProvider;
  let useCase: LoginUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    userCredentialsRepository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 1,
        email: "user@example.com",
        passwordHash: "hashed-password",
      }),
    };

    refreshTokenRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findUserIdByTokenId: vi.fn(),
      delete: vi.fn(),
    };

    accessTokenProvider = {
      sign: vi.fn().mockResolvedValue({
        accessToken: "access-token",
        expiresIn: 900,
      }),
      verify: vi.fn(),
    };

    useCase = new LoginUseCase(
      userCredentialsRepository,
      refreshTokenRepository,
      accessTokenProvider,
      refreshTokenTtlSeconds
    );
  });

  it("should return tokens and persist refresh token on valid credentials", async () => {
    const result = await useCase.execute({
      email: "user@example.com",
      password: "plain-password",
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "plain-password",
      "hashed-password"
    );
    expect(refreshTokenRepository.save).toHaveBeenCalledWith(
      "refresh-token-id",
      1,
      refreshTokenTtlSeconds
    );
    expect(accessTokenProvider.sign).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      accessToken: "access-token",
      expiresIn: 900,
      refreshTokenId: "refresh-token-id",
    });
  });

  it("should throw InvalidCredentialsException when user is not found", async () => {
    vi.mocked(userCredentialsRepository.findByEmail).mockResolvedValue(null);

    await expect(
      useCase.execute({ email: "user@example.com", password: "plain-password" })
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
  });

  it("should throw InvalidCredentialsException when password does not match", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      useCase.execute({ email: "user@example.com", password: "wrong-password" })
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
  });
});
