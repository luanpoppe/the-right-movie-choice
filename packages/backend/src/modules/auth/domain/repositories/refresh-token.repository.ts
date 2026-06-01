export interface IRefreshTokenRepository {
  save(tokenId: string, userId: number, ttlSeconds: number): Promise<void>;

  findUserIdByTokenId(tokenId: string): Promise<number | null>;

  delete(tokenId: string): Promise<void>;
}
