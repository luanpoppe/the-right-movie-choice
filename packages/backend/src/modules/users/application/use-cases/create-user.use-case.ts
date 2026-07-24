import bcrypt from "bcrypt";
import { Logger } from "@/lib/logger/logger";
import { BCRYPT_SALT_ROUNDS } from "@/shared/constants/bcrypt.constants";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserAlreadyExistsException } from "../../domain/exceptions/user-already-exists.exception";
import { IUserRepository } from "../../domain/repositories/user.repository";

export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
};

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<UserEntity> {
    Logger.info("📝 Register user started", { email: input.email });

    const authProfile = await this.userRepository.findAuthByEmail(input.email);

    if (authProfile?.passwordHash) {
      Logger.warn("⚠️ Register rejected: email already has password", {
        email: input.email,
      });
      throw new UserAlreadyExistsException(input.email);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    if (authProfile) {
      const user = await this.userRepository.setPasswordHash(
        authProfile.id,
        passwordHash,
      );
      Logger.info("✅ Native password set on existing Google account", {
        userId: user.id,
        email: user.email,
      });
      return user;
    }

    const user = await this.userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    Logger.info("✅ User registered", { userId: user.id, email: user.email });

    return user;
  }
}
