import z from "zod";

export const UserEntitySchema = z.object({
  id: z.int().positive(),
  email: z.email(),
  name: z.string().min(1),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type UserEntity = z.infer<typeof UserEntitySchema>;
