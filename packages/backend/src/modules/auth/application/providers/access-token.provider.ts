export type AccessTokenResult = {
  accessToken: string;
  expiresIn: number;
};

export interface IAccessTokenProvider {
  sign(userId: number): Promise<AccessTokenResult>;

  verify(accessToken: string): Promise<{ userId: number }>;
}
