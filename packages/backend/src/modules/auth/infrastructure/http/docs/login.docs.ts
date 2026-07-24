import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { InvalidCredentialsException } from "../../../domain/exceptions/invalid-credentials.exception";
import {
  AuthTokensResponseDTOSchema,
  LoginRequestDTOSchema,
} from "../dto/auth.dto";

export const LoginDocs: RouteShorthandOptions = {
  schema: {
    tags: ["auth"],
    body: LoginRequestDTOSchema,
    description:
      "Authenticate with email and password. Returns access token in body and refresh token in httpOnly cookie.",
    response: {
      200: AuthTokensResponseDTOSchema.describe("Success"),
      400: z
        .object({ error: z.string().or(z.array(z.any())) })
        .describe("Bad Request"),
      401: z
        .object({
          error: z.enum([new InvalidCredentialsException().message]),
        })
        .describe("Unauthorized"),
    },
  },
};
