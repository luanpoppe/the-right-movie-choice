export type UserAuthProfile = {
  id: number;
  email: string;
  name: string;

  passwordHash: string | null;
  googleId: string | null;
};
