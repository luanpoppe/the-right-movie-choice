import {
  UserEntity,
  UserEntitySchema,
} from "../../domain/entities/user.entity";

type PrismaUserModel = UserEntity & {
  passwordHash: string | null;
  googleId: string | null;
};

export class UserMapper {
  static toEntity(user: PrismaUserModel): UserEntity {
    return UserEntitySchema.parse(user);
  }
}
