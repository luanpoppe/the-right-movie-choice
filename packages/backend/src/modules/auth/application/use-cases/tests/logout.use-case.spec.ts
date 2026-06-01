import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogoutUseCase } from "../logout.use-case";
import { IRefreshTokenRepository } from "../../../domain/repositories/refresh-token.repository";

describe("LogoutUseCase", () => {
  let refreshTokenRepository: IRefreshTokenRepository;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    refreshTokenRepository = {
      save: vi.fn(),
      findUserIdByTokenId: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new LogoutUseCase(refreshTokenRepository);
  });

  it("should delete refresh token when token id is provided", async () => {
    await useCase.execute("refresh-token-id");

    expect(refreshTokenRepository.delete).toHaveBeenCalledWith(
      "refresh-token-id"
    );
  });

  it("should not call delete when token id is missing", async () => {
    await useCase.execute(undefined);

    expect(refreshTokenRepository.delete).not.toHaveBeenCalled();
  });
});
