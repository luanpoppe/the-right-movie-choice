export type GoogleUserPayload = {
  sub: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

export interface IGoogleIdTokenVerifier {
  verify(idToken: string): Promise<GoogleUserPayload>;
}
