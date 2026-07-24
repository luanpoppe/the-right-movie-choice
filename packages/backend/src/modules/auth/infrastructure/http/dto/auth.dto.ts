import z from "zod";

export const LoginRequestDTOSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestDTOSchema>;

export const AuthTokensResponseDTOSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int().positive(),
  tokenType: z.literal("Bearer"),
});

export type AuthTokensResponse = z.infer<typeof AuthTokensResponseDTOSchema>;

export const GoogleAuthRequestDTOSchema = z.object({
  idToken: z.string().min(1),
});

export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestDTOSchema>;
