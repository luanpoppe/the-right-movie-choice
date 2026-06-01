import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { IUserCredentialsRepository } from "@/modules/users/domain/repositories/user-credentials.repository";
import { InvalidCredentialsException } from "../../domain/exceptions/invalid-credentials.exception";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import { AuthTokensResult } from "../dtos/auth-tokens.dto";
import { LoginInput } from "../dtos/login.dto";
import { IAccessTokenProvider } from "../providers/access-token.provider";

export class LoginUseCase {
  constructor(
    private userCredentialsRepository: IUserCredentialsRepository,
    private refreshTokenRepository: IRefreshTokenRepository,
    private accessTokenProvider: IAccessTokenProvider,
    private refreshTokenTtlSeconds: number,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokensResult> {
    const credentials = await this.userCredentialsRepository.findByEmail(
      input.email,
    );

    if (!credentials) throw new InvalidCredentialsException();

    const passwordMatches = await bcrypt.compare(
      input.password,
      credentials.passwordHash,
    );

    if (!passwordMatches) throw new InvalidCredentialsException();

    const refreshTokenId = randomUUID();

    await this.refreshTokenRepository.save(
      refreshTokenId,
      credentials.id,
      this.refreshTokenTtlSeconds,
    );

    const { accessToken, expiresIn } = await this.accessTokenProvider.sign(
      credentials.id,
    );

    return {
      accessToken,
      expiresIn,
      refreshTokenId,
    };
  }
}
