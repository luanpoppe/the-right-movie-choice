export type UserCredentials = {
  id: number;
  email: string;
  passwordHash: string | null;
};

export interface IUserCredentialsRepository {
  findByEmail(email: string): Promise<UserCredentials | null>;
}
