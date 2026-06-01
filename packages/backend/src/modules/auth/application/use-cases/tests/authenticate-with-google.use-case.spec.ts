import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticateWithGoogleUseCase } from "../authenticate-with-google.use-case";
import { IGoogleIdTokenVerifier } from "../../providers/google-id-token.verifier";
import { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import { AuthSessionFacade } from "../../facades/auth-session.facade";
import { GoogleAccountConflictException } from "../../../domain/exceptions/google-account-conflict.exception";
import { UserEntity } from "@/modules/users/domain/entities/user.entity";

describe("AuthenticateWithGoogleUseCase", () => {
  const mockUser: UserEntity = {
    id: 1,
    email: "user@example.com",
    name: "Test User",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const googlePayload = {
    sub: "google-sub-123",
    email: "user@example.com",
    name: "Test User",
    emailVerified: true,
  };

  const tokensResult = {
    accessToken: "access-token",
    expiresIn: 900,
    refreshTokenId: "refresh-token-id",
  };

  let googleIdTokenVerifier: IGoogleIdTokenVerifier;
  let userRepository: IUserRepository;
  let authSessionFacade: AuthSessionFacade;
  let useCase: AuthenticateWithGoogleUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    googleIdTokenVerifier = {
      verify: vi.fn().mockResolvedValue(googlePayload),
    };

    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByGoogleId: vi.fn().mockResolvedValue(null),
      findAuthByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      createWithGoogle: vi.fn().mockResolvedValue(mockUser),
      linkGoogleAccount: vi.fn().mockResolvedValue(mockUser),
      setPasswordHash: vi.fn(),
    };

    authSessionFacade = {
      issue: vi.fn().mockResolvedValue(tokensResult),
    } as unknown as AuthSessionFacade;

    useCase = new AuthenticateWithGoogleUseCase(
      googleIdTokenVerifier,
      userRepository,
      authSessionFacade,
    );
  });

  it("should create a new user and issue tokens when no account exists", async () => {
    const result = await useCase.execute({ idToken: "valid-token" });

    expect(userRepository.createWithGoogle).toHaveBeenCalledWith({
      email: googlePayload.email,
      name: googlePayload.name,
      googleId: googlePayload.sub,
    });
    expect(authSessionFacade.issue).toHaveBeenCalledWith(1);
    expect(result).toEqual(tokensResult);
  });

  it("should link Google account and issue tokens for existing native user", async () => {
    vi.mocked(userRepository.findAuthByEmail).mockResolvedValue({
      id: 1,
      email: googlePayload.email,
      name: googlePayload.name,
      passwordHash: "hashed-password",
      googleId: null,
    });

    const result = await useCase.execute({ idToken: "valid-token" });

    expect(userRepository.linkGoogleAccount).toHaveBeenCalledWith(1, googlePayload.sub);
    expect(userRepository.createWithGoogle).not.toHaveBeenCalled();
    expect(authSessionFacade.issue).toHaveBeenCalledWith(1);
    expect(result).toEqual(tokensResult);
  });

  it("should issue tokens when user already has matching googleId", async () => {
    vi.mocked(userRepository.findByGoogleId).mockResolvedValue(mockUser);

    const result = await useCase.execute({ idToken: "valid-token" });

    expect(userRepository.findAuthByEmail).not.toHaveBeenCalled();
    expect(userRepository.linkGoogleAccount).not.toHaveBeenCalled();
    expect(authSessionFacade.issue).toHaveBeenCalledWith(1);
    expect(result).toEqual(tokensResult);
  });

  it("should throw GoogleAccountConflictException when googleId differs", async () => {
    vi.mocked(userRepository.findAuthByEmail).mockResolvedValue({
      id: 1,
      email: googlePayload.email,
      name: googlePayload.name,
      passwordHash: "hashed-password",
      googleId: "other-google-id",
    });

    await expect(
      useCase.execute({ idToken: "valid-token" }),
    ).rejects.toBeInstanceOf(GoogleAccountConflictException);

    expect(authSessionFacade.issue).not.toHaveBeenCalled();
  });
});
