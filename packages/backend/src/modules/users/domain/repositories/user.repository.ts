import { UserEntity } from "../entities/user.entity";
import { CreateGoogleUserData } from "../types/create-google-user-data.type";
import { CreateUserData } from "../types/create-user-data.type";
import { UserAuthProfile } from "../types/user-auth-profile.type";

export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>;

  findByEmail(email: string): Promise<UserEntity | null>;

  findByGoogleId(googleId: string): Promise<UserEntity | null>;

  findAuthByEmail(email: string): Promise<UserAuthProfile | null>;

  create(data: CreateUserData): Promise<UserEntity>;

  createWithGoogle(data: CreateGoogleUserData): Promise<UserEntity>;

  linkGoogleAccount(userId: number, googleId: string): Promise<UserEntity>;

  setPasswordHash(userId: number, passwordHash: string): Promise<UserEntity>;
}
