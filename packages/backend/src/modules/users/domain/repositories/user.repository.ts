import { UserEntity } from "../entities/user.entity";

export type CreateUserData = {
  email: string;
  name: string;
  passwordHash: string;
};

export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>;

  findByEmail(email: string): Promise<UserEntity | null>;

  create(data: CreateUserData): Promise<UserEntity>;
}
