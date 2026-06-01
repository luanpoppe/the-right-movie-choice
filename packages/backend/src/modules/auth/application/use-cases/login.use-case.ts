import bcrypt from "bcrypt";
import { IUserCredentialsRepository } from "@/modules/users/domain/repositories/user-credentials.repository";
import { InvalidCredentialsException } from "../../domain/exceptions/invalid-credentials.exception";
import { AuthTokensResult } from "../dtos/auth-tokens.dto";
import { LoginInput } from "../dtos/login.dto";
import { AuthSessionFacade } from "../facades/auth-session.facade";

export class LoginUseCase {
  constructor(
    private userCredentialsRepository: IUserCredentialsRepository,
    private authSessionFacade: AuthSessionFacade,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokensResult> {
    const credentials = await this.userCredentialsRepository.findByEmail(
      input.email,
    );

    if (!credentials || !credentials.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      credentials.passwordHash,
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    return this.authSessionFacade.issue(credentials.id);
  }
}
