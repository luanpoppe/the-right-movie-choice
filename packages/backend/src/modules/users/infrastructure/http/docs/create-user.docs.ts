import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { UserAlreadyExistsException } from "../../../domain/exceptions/user-already-exists.exception";
import {
  CreateUserRequestDTOSchema,
  CreateUserResponseDTOSchema,
} from "../dto/create-user.dto";

export const CreateUserDocs: RouteShorthandOptions = {
  schema: {
    tags: ["users"],
    body: CreateUserRequestDTOSchema,
    description: "Register a new user",
    response: {
      201: CreateUserResponseDTOSchema.describe("Created"),
      400: z
        .object({ error: z.string().or(z.array(z.any())) })
        .describe("Bad Request"),
      409: z
        .object({
          error: z.enum([
            new UserAlreadyExistsException("user@example.com").message,
          ]),
        })
        .describe("Conflict"),
    },
  },
};
