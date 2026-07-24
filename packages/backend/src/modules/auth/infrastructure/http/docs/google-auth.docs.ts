import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { GoogleAccountConflictException } from "../../../domain/exceptions/google-account-conflict.exception";
import { GoogleEmailNotVerifiedException } from "../../../domain/exceptions/google-email-not-verified.exception";
import {
  AuthTokensResponseDTOSchema,
  GoogleAuthRequestDTOSchema,
} from "../dto/auth.dto";

export const GoogleAuthDocs: RouteShorthandOptions = {
  schema: {
    tags: ["auth"],
    body: GoogleAuthRequestDTOSchema,
    description:
      "Authenticate with Google ID token. Links to an existing native account when the email matches.",
    response: {
      200: AuthTokensResponseDTOSchema.describe("Success"),
      400: z
        .object({ error: z.string().or(z.array(z.any())) })
        .describe("Bad Request"),
      401: z
        .object({
          error: z.enum([new GoogleEmailNotVerifiedException().message]),
        })
        .describe("Unauthorized"),
      409: z
        .object({
          error: z.enum([new GoogleAccountConflictException().message]),
        })
        .describe("Conflict"),
    },
  },
};
