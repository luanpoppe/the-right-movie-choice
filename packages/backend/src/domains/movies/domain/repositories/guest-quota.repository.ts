export interface IGuestQuotaRepository {
  getUsedCount(guestId: string): Promise<number>;

  increment(guestId: string): Promise<number>;
}
