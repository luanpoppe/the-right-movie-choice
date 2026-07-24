import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { PrismaUserRepository } from "../repositories/prisma-user.repository";

export class MakeCreateUserUseCaseFactory {
  static create() {
    const userRepository = new PrismaUserRepository();

    return new CreateUserUseCase(userRepository);
  }
}
