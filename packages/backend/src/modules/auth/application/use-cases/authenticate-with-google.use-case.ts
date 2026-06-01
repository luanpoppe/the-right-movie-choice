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
    const googleUser = await this.googleIdTokenVerifier.verify(input.idToken);

    const userByGoogleId = await this.userRepository.findByGoogleId(
      googleUser.sub,
    );

    if (userByGoogleId) return this.authSessionFacade.issue(userByGoogleId.id);

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

    return this.authSessionFacade.issue(newUser.id);
  }

  async processAuthProfile(
    { googleId, id }: UserAuthProfile,
    { sub }: GoogleUserPayload,
  ) {
    const isGoogleIdDifferent = googleId && googleId !== sub;
    if (isGoogleIdDifferent) {
      throw new GoogleAccountConflictException();
    }

    if (!googleId) {
      await this.userRepository.linkGoogleAccount(id, sub);
    }

    return this.authSessionFacade.issue(id);
  }
}
