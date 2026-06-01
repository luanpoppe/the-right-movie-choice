import {
  UserEntity,
  UserEntitySchema,
} from "../../domain/entities/user.entity";

type PrismaUserModel = UserEntity & { passwordHash: string };

export class UserMapper {
  static toEntity(user: PrismaUserModel): UserEntity {
    return UserEntitySchema.parse(user);
  }
}
