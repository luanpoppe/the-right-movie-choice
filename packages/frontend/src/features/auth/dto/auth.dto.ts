export type AuthTokensResponse = {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
};

export type GoogleAuthRequest = {
  idToken: string;
};
