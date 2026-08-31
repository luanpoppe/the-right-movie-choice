import { describe, it, expect, vi, beforeEach } from "vitest";
import { GuestQuotaService } from "../guest-quota.service";
import { GuestQuotaExceededException } from "../../domain/exceptions/guest-quota-exceeded.exception";
import { IGuestQuotaRepository } from "../../domain/repositories/guest-quota.repository";

describe("GuestQuotaService", () => {
  const guestId = "guest-test-id";
  let guestQuotaRepository: IGuestQuotaRepository;
  let guestQuotaService: GuestQuotaService;

  beforeEach(() => {
    guestQuotaRepository = {
      getUsedCount: vi.fn(),
      increment: vi.fn(),
    };
    guestQuotaService = new GuestQuotaService(guestQuotaRepository);
  });

  describe("getRemaining", () => {
    it("returns 2 when used is 0", async () => {
      vi.mocked(guestQuotaRepository.getUsedCount).mockResolvedValue(0);

      const remaining = await guestQuotaService.getRemaining(guestId);

      expect(remaining).toBe(2);
    });

    it("returns 1 when used is 1", async () => {
      vi.mocked(guestQuotaRepository.getUsedCount).mockResolvedValue(1);

      const remaining = await guestQuotaService.getRemaining(guestId);

      expect(remaining).toBe(1);
    });

    it("returns 0 when used is 2", async () => {
      vi.mocked(guestQuotaRepository.getUsedCount).mockResolvedValue(2);

      const remaining = await guestQuotaService.getRemaining(guestId);

      expect(remaining).toBe(0);
    });
  });

  describe("assertCanAcceptAnonymousRecommendation", () => {
    it("does not throw when used is 0", async () => {
      vi.mocked(guestQuotaRepository.getUsedCount).mockResolvedValue(0);

      await expect(
        guestQuotaService.assertCanAcceptAnonymousRecommendation(guestId),
      ).resolves.toBeUndefined();
      expect(guestQuotaRepository.increment).not.toHaveBeenCalled();
    });

    it("does not throw when used is 1", async () => {
      vi.mocked(guestQuotaRepository.getUsedCount).mockResolvedValue(1);

      await expect(
        guestQuotaService.assertCanAcceptAnonymousRecommendation(guestId),
      ).resolves.toBeUndefined();
      expect(guestQuotaRepository.increment).not.toHaveBeenCalled();
    });

    it("throws GuestQuotaExceededException when used is 2", async () => {
      vi.mocked(guestQuotaRepository.getUsedCount).mockResolvedValue(2);

      await expect(
        guestQuotaService.assertCanAcceptAnonymousRecommendation(guestId),
      ).rejects.toBeInstanceOf(GuestQuotaExceededException);
      expect(guestQuotaRepository.increment).not.toHaveBeenCalled();
    });
  });

  describe("incrementAfterSuccess", () => {
    it("returns remaining 1 after increment from used 0", async () => {
      vi.mocked(guestQuotaRepository.increment).mockResolvedValue(1);

      const remaining = await guestQuotaService.incrementAfterSuccess(guestId);

      expect(guestQuotaRepository.increment).toHaveBeenCalledWith(guestId);
      expect(remaining).toBe(1);
    });

    it("returns remaining 0 after increment from used 1", async () => {
      vi.mocked(guestQuotaRepository.increment).mockResolvedValue(2);

      const remaining = await guestQuotaService.incrementAfterSuccess(guestId);

      expect(guestQuotaRepository.increment).toHaveBeenCalledWith(guestId);
      expect(remaining).toBe(0);
    });
  });
});
