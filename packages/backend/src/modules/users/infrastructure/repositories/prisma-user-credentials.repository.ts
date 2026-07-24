import { prisma } from "@/lib/prisma/prisma";
import {
  IUserCredentialsRepository,
  UserCredentials,
} from "../../domain/repositories/user-credentials.repository";

export class PrismaUserCredentialsRepository implements IUserCredentialsRepository {
  async findByEmail(email: string): Promise<UserCredentials | null> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }
}
