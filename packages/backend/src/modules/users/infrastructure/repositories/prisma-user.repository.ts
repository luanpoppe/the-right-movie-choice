import { prisma } from "@/lib/prisma/prisma";
import { PrismaUtil } from "@/shared/utils/prisma.util";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserAlreadyExistsException } from "../../domain/exceptions/user-already-exists.exception";
import {
  CreateUserData,
  IUserRepository,
} from "../../domain/repositories/user.repository";
import { UserMapper } from "../mappers/user.mapper";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: number): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return null;
    }

    return UserMapper.toEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return null;

    return UserMapper.toEntity(user);
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    try {
      const user = await prisma.user.create({ data });

      return UserMapper.toEntity(user);
    } catch (error) {
      if (PrismaUtil.isUniqueConstraintViolation(error)) {
        throw new UserAlreadyExistsException(data.email);
      }

      throw error;
    }
  }
}
