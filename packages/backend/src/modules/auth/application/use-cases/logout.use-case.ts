import { Logger } from "@/lib/logger/logger";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";

export class LogoutUseCase {
  constructor(private refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(refreshTokenId: string | undefined): Promise<void> {
    if (!refreshTokenId) {
      Logger.warn("⚠️ Logout skipped: refresh cookie missing");
      return;
    }

    await this.refreshTokenRepository.delete(refreshTokenId);

    Logger.info("✅ Logout completed: refresh token revoked");
  }
}
