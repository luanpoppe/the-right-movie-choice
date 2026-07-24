import bcrypt from "bcrypt";
import { Logger } from "@/lib/logger/logger";
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
    Logger.info("🔐 Native login started", { email: input.email });

    const credentials = await this.userCredentialsRepository.findByEmail(
      input.email,
    );

    if (!credentials || !credentials.passwordHash) {
      Logger.warn("⚠️ Native login failed: invalid credentials", {
        email: input.email,
      });
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      credentials.passwordHash,
    );

    if (!passwordMatches) {
      Logger.warn("⚠️ Native login failed: invalid credentials", {
        email: input.email,
      });
      throw new InvalidCredentialsException();
    }

    Logger.info("✅ Native login succeeded", { userId: credentials.id });

    return this.authSessionFacade.issue(credentials.id);
  }
}
