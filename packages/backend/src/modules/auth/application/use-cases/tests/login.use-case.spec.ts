import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { LoginUseCase } from "../login.use-case";
import { IUserCredentialsRepository } from "@/modules/users/domain/repositories/user-credentials.repository";
import { AuthSessionFacade } from "../../facades/auth-session.facade";
import { InvalidCredentialsException } from "../../../domain/exceptions/invalid-credentials.exception";

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe("LoginUseCase", () => {
  let userCredentialsRepository: IUserCredentialsRepository;
  let authSessionFacade: AuthSessionFacade;
  let useCase: LoginUseCase;

  const tokensResult = {
    accessToken: "access-token",
    expiresIn: 900,
    refreshTokenId: "refresh-token-id",
  };

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

    authSessionFacade = {
      issue: vi.fn().mockResolvedValue(tokensResult),
    } as unknown as AuthSessionFacade;

    useCase = new LoginUseCase(userCredentialsRepository, authSessionFacade);
  });

  it("should return tokens on valid credentials", async () => {
    const result = await useCase.execute({
      email: "user@example.com",
      password: "plain-password",
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "plain-password",
      "hashed-password",
    );
    expect(authSessionFacade.issue).toHaveBeenCalledWith(1);
    expect(result).toEqual(tokensResult);
  });

  it("should throw InvalidCredentialsException when user is not found", async () => {
    vi.mocked(userCredentialsRepository.findByEmail).mockResolvedValue(null);

    await expect(
      useCase.execute({ email: "user@example.com", password: "plain-password" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(authSessionFacade.issue).not.toHaveBeenCalled();
  });

  it("should throw InvalidCredentialsException when password hash is null", async () => {
    vi.mocked(userCredentialsRepository.findByEmail).mockResolvedValue({
      id: 1,
      email: "user@example.com",
      passwordHash: null,
    });

    await expect(
      useCase.execute({ email: "user@example.com", password: "plain-password" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(authSessionFacade.issue).not.toHaveBeenCalled();
  });

  it("should throw InvalidCredentialsException when password does not match", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      useCase.execute({ email: "user@example.com", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(authSessionFacade.issue).not.toHaveBeenCalled();
  });
});
