import { Logger } from "@/lib/logger/logger";
import { GuestQuotaConstants } from "../domain/guest-quota.constants";
import { GuestQuotaExceededException } from "../domain/exceptions/guest-quota-exceeded.exception";
import { IGuestQuotaRepository } from "../domain/repositories/guest-quota.repository";

export class GuestQuotaService {
  constructor(private guestQuotaRepository: IGuestQuotaRepository) {}

  async getRemaining(guestId: string): Promise<number> {
    const usedCount = await this.guestQuotaRepository.getUsedCount(guestId);
    const remaining = this.toRemaining(usedCount);

    Logger.debug("Guest quota remaining computed", {
      guestIdSuffix: this.guestIdSuffix(guestId),
      remaining,
    });

    return remaining;
  }

  async assertCanAcceptAnonymousRecommendation(guestId: string): Promise<void> {
    const usedCount = await this.guestQuotaRepository.getUsedCount(guestId);
    const isQuotaExceeded =
      usedCount >= GuestQuotaConstants.RECOMMENDATION_LIMIT;

    if (!isQuotaExceeded) {
      Logger.debug("Guest quota allows anonymous recommendation", {
        guestIdSuffix: this.guestIdSuffix(guestId),
        usedCount,
      });
      return;
    }

    Logger.info("Guest quota exceeded for anonymous recommendation", {
      guestIdSuffix: this.guestIdSuffix(guestId),
      usedCount,
    });
    throw new GuestQuotaExceededException();
  }

  async incrementAfterSuccess(guestId: string): Promise<number> {
    const newUsedCount = await this.guestQuotaRepository.increment(guestId);
    const remaining = this.toRemaining(newUsedCount);

    Logger.info("Guest quota incremented after successful recommendation", {
      guestIdSuffix: this.guestIdSuffix(guestId),
      remaining,
    });

    return remaining;
  }

  private toRemaining(usedCount: number): number {
    const remaining = GuestQuotaConstants.RECOMMENDATION_LIMIT - usedCount;
    return Math.max(0, remaining);
  }

  private guestIdSuffix(guestId: string): string {
    return guestId.slice(-4);
  }
}
