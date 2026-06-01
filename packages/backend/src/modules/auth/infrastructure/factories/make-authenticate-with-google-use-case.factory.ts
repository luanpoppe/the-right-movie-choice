import { env } from "@/env";
import { PrismaUserRepository } from "@/modules/users/infrastructure/repositories/prisma-user.repository";
import { AuthenticateWithGoogleUseCase } from "../../application/use-cases/authenticate-with-google.use-case";
import { GoogleIdTokenVerifier } from "../providers/google-id-token.verifier";
import { MakeAuthSessionFacadeFactory } from "./make-auth-session-facade.factory";

export class MakeAuthenticateWithGoogleUseCaseFactory {
  static create() {
    const googleIdTokenVerifier = new GoogleIdTokenVerifier(env.GOOGLE_CLIENT_ID);
    const userRepository = new PrismaUserRepository();
    const authSessionFacade = MakeAuthSessionFacadeFactory.create();

    return new AuthenticateWithGoogleUseCase(
      googleIdTokenVerifier,
      userRepository,
      authSessionFacade,
    );
  }
}
