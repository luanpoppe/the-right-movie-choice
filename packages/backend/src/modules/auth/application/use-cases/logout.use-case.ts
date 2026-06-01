import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";

export class LogoutUseCase {
  constructor(private refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(refreshTokenId: string | undefined): Promise<void> {
    if (!refreshTokenId) return;

    await this.refreshTokenRepository.delete(refreshTokenId);
  }
}
