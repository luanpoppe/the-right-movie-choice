import { CookieSerializeOptions } from "@fastify/cookie";
import { env } from "@/env";

export class RefreshTokenCookie {
  static getName(): string {
    return env.REFRESH_COOKIE_NAME;
  }

  static buildOptions(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "prod",
      sameSite: "lax",
      path: "/",
      maxAge: env.REFRESH_TOKEN_TTL_SECONDS,
    };
  }

  static buildClearOptions(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "prod",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    };
  }
}
