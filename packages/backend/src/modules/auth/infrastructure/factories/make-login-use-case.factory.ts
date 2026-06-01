import { PrismaUserCredentialsRepository } from "@/modules/users/infrastructure/repositories/prisma-user-credentials.repository";
import { LoginUseCase } from "../../application/use-cases/login.use-case";
import { MakeAuthSessionFacadeFactory } from "./make-auth-session-facade.factory";

export class MakeLoginUseCaseFactory {
  static create() {
    const userCredentialsRepository = new PrismaUserCredentialsRepository();
    const authSessionFacade = MakeAuthSessionFacadeFactory.create();

    return new LoginUseCase(userCredentialsRepository, authSessionFacade);
  }
}
