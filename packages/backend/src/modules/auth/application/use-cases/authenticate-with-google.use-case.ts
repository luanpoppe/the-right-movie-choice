import { Logger } from "@/lib/logger/logger";
import { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import { GoogleAccountConflictException } from "../../domain/exceptions/google-account-conflict.exception";
import { AuthTokensResult } from "../dtos/auth-tokens.dto";
import { GoogleAuthInput } from "../dtos/google-auth.dto";
import {
  GoogleUserPayload,
  IGoogleIdTokenVerifier,
} from "../providers/google-id-token.verifier";
import { AuthSessionFacade } from "../facades/auth-session.facade";
import { UserAuthProfile } from "@/modules/users/domain/types/user-auth-profile.type";

export class AuthenticateWithGoogleUseCase {
  constructor(
    private googleIdTokenVerifier: IGoogleIdTokenVerifier,
    private userRepository: IUserRepository,
    private authSessionFacade: AuthSessionFacade,
  ) {}

  async execute(input: GoogleAuthInput): Promise<AuthTokensResult> {
    Logger.info("🔐 Google login started");

    const googleUser = await this.googleIdTokenVerifier.verify(input.idToken);

    Logger.info("🔍 Google token verified", { email: googleUser.email });

    const userByGoogleId = await this.userRepository.findByGoogleId(
      googleUser.sub,
    );

    if (userByGoogleId) {
      Logger.info("✅ Google login: existing linked account", {
        userId: userByGoogleId.id,
      });
      return this.authSessionFacade.issue(userByGoogleId.id);
    }

    const authProfile = await this.userRepository.findAuthByEmail(
      googleUser.email,
    );

    if (authProfile)
      return await this.processAuthProfile(authProfile, googleUser);

    const newUser = await this.userRepository.createWithGoogle({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.sub,
    });

    Logger.info("✅ Google account created", {
      userId: newUser.id,
      email: newUser.email,
    });

    return this.authSessionFacade.issue(newUser.id);
  }

  async processAuthProfile(
    { googleId, id }: UserAuthProfile,
    { sub }: GoogleUserPayload,
  ) {
    const isGoogleIdDifferent = googleId && googleId !== sub;
    if (isGoogleIdDifferent) {
      Logger.warn("⚠️ Google login rejected: account linked to another Google ID", {
        userId: id,
      });
      throw new GoogleAccountConflictException();
    }

    if (!googleId) {
      await this.userRepository.linkGoogleAccount(id, sub);
      Logger.info("✅ Google account linked to native user", { userId: id });
    }

    return this.authSessionFacade.issue(id);
  }
}
