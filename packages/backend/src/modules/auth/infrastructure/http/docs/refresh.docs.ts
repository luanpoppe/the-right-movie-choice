import z from "zod";
import { RouteShorthandOptions } from "fastify";
import { InvalidRefreshTokenException } from "../../../domain/exceptions/invalid-refresh-token.exception";
import { AuthTokensResponseDTOSchema } from "../dto/auth.dto";

export const RefreshDocs: RouteShorthandOptions = {
  schema: {
    tags: ["auth"],
    description:
      "Issue a new access token using the refresh token httpOnly cookie. Rotates the refresh token.",
    response: {
      200: AuthTokensResponseDTOSchema.describe("Success"),
      401: z
        .object({
          error: z.enum([new InvalidRefreshTokenException().message]),
        })
        .describe("Unauthorized"),
    },
  },
};
