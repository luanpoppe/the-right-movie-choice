import z from "zod";
import { UserEntitySchema } from "../../../domain/entities/user.entity";

export const CreateUserRequestDTOSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestDTOSchema>;

export const CreateUserResponseDTOSchema = UserEntitySchema;

export type CreateUserResponse = z.infer<typeof CreateUserResponseDTOSchema>;
