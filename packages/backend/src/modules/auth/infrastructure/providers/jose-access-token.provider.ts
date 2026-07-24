import { SignJWT, jwtVerify } from "jose";
import { env } from "@/env";
import {
  AccessTokenResult,
  IAccessTokenProvider,
} from "../../application/providers/access-token.provider";

export class JoseAccessTokenProvider implements IAccessTokenProvider {
  private secret = new TextEncoder().encode(env.JWT_SECRET);

  async sign(userId: number): Promise<AccessTokenResult> {
    const sub = String(userId);
    const accessToken = await new SignJWT({ sub })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
      .sign(this.secret);

    const { payload } = await jwtVerify(accessToken, this.secret);

    const expiresIn =
      payload.exp !== undefined && payload.iat !== undefined
        ? payload.exp - payload.iat
        : 0;

    return { accessToken, expiresIn };
  }

  async verify(accessToken: string): Promise<{ userId: number }> {
    const { payload } = await jwtVerify(accessToken, this.secret);

    const sub = payload.sub;

    if (!sub) throw new Error("Invalid access token");

    const userId = Number(sub);

    if (!Number.isInteger(userId) || userId <= 0)
      throw new Error("Invalid access token");

    return { userId };
  }
}
