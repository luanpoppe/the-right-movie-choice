import bcrypt from "bcrypt";
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
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) throw new UserAlreadyExistsException(input.email);

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    return this.userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
  }
}
