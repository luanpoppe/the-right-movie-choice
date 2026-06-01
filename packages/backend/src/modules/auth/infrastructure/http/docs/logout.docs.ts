import { RouteShorthandOptions } from "fastify";

export const LogoutDocs: RouteShorthandOptions = {
  schema: {
    tags: ["auth"],
    description:
      "Revoke the refresh token from Redis and clear the httpOnly cookie.",
    response: {
      204: {
        type: "null",
        description: "No Content",
      },
    },
  },
};
