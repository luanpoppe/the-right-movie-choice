import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { BCRYPT_SALT_ROUNDS } from "@/shared/constants/bcrypt.constants";
import { CreateUserUseCase } from "./create-user.use-case";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { UserAlreadyExistsException } from "../../domain/exceptions/user-already-exists.exception";
import { UserEntity } from "../../domain/entities/user.entity";

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe("CreateUserUseCase", () => {
  const mockUser: UserEntity = {
    id: 1,
    email: "user@example.com",
    name: "Test User",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  let userRepository: IUserRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);

    userRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByGoogleId: vi.fn().mockResolvedValue(null),
      findAuthByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockUser),
      createWithGoogle: vi.fn(),
      linkGoogleAccount: vi.fn(),
      setPasswordHash: vi.fn().mockResolvedValue(mockUser),
    };

    useCase = new CreateUserUseCase(userRepository);
  });

  it("should hash the password and create the user", async () => {
    const input = {
      email: "user@example.com",
      name: "Test User",
      password: "plain-password",
    };

    const result = await useCase.execute(input);

    expect(bcrypt.hash).toHaveBeenCalledWith(
      "plain-password",
      BCRYPT_SALT_ROUNDS,
    );
    expect(userRepository.create).toHaveBeenCalledWith({
      email: input.email,
      name: input.name,
      passwordHash: "hashed-password",
    });
    expect(result).toEqual(mockUser);
  });

  it("should set password when email exists from Google-only account", async () => {
    vi.mocked(userRepository.findAuthByEmail).mockResolvedValue({
      id: 1,
      email: "user@example.com",
      name: "Test User",
      passwordHash: null,
      googleId: "google-sub",
    });

    const result = await useCase.execute({
      email: "user@example.com",
      name: "Test User",
      password: "plain-password",
    });

    expect(userRepository.setPasswordHash).toHaveBeenCalledWith(
      1,
      "hashed-password",
    );
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it("should throw UserAlreadyExistsException when email already has a password", async () => {
    vi.mocked(userRepository.findAuthByEmail).mockResolvedValue({
      id: 1,
      email: "user@example.com",
      name: "Test User",
      passwordHash: "existing-hash",
      googleId: null,
    });

    await expect(
      useCase.execute({
        email: "user@example.com",
        name: "Test User",
        password: "plain-password",
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsException);

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.setPasswordHash).not.toHaveBeenCalled();
  });
});
