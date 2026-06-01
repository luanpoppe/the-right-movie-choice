import { OAuth2Client } from "google-auth-library";
import {
  GoogleUserPayload,
  IGoogleIdTokenVerifier,
} from "../../application/providers/google-id-token.verifier";
import { GoogleEmailNotVerifiedException } from "../../domain/exceptions/google-email-not-verified.exception";

export class GoogleIdTokenVerifier implements IGoogleIdTokenVerifier {
  private client: OAuth2Client;

  constructor(private googleClientId: string) {
    this.client = new OAuth2Client(googleClientId);
  }

  async verify(idToken: string): Promise<GoogleUserPayload> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new GoogleEmailNotVerifiedException();
    }

    if (!payload.email_verified) {
      throw new GoogleEmailNotVerifiedException();
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      emailVerified: payload.email_verified,
    };
  }
}
