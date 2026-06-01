import { prisma } from "@/lib/prisma/prisma";
import { GoogleAccountConflictException } from "@/modules/auth/domain/exceptions/google-account-conflict.exception";
import { PrismaErrorMapper } from "@/shared/mappers/prisma-error.mapper";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserAlreadyExistsException } from "../../domain/exceptions/user-already-exists.exception";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { CreateGoogleUserData } from "../../domain/types/create-google-user-data.type";
import { CreateUserData } from "../../domain/types/create-user-data.type";
import { UserAuthProfile } from "../../domain/types/user-auth-profile.type";
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

  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) return null;

    return UserMapper.toEntity(user);
  }

  async findAuthByEmail(email: string): Promise<UserAuthProfile | null> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      googleId: user.googleId,
    };
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    try {
      const user = await prisma.user.create({ data });

      return UserMapper.toEntity(user);
    } catch (error) {
      PrismaErrorMapper.mapUniqueViolationOrRethrow(
        error,
        new UserAlreadyExistsException(data.email),
      );
    }
  }

  async createWithGoogle(data: CreateGoogleUserData): Promise<UserEntity> {
    try {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          googleId: data.googleId,
        },
      });

      return UserMapper.toEntity(user);
    } catch (error) {
      PrismaErrorMapper.mapUniqueViolationOrRethrow(
        error,
        new UserAlreadyExistsException(data.email),
      );
    }
  }

  async linkGoogleAccount(userId: number, googleId: string): Promise<UserEntity> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { googleId },
      });

      return UserMapper.toEntity(user);
    } catch (error) {
      PrismaErrorMapper.mapUniqueViolationOrRethrow(
        error,
        new GoogleAccountConflictException(),
      );
    }
  }

  async setPasswordHash(userId: number, passwordHash: string): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return UserMapper.toEntity(user);
  }
}
