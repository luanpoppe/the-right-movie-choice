import { BaseException } from "@/core/exceptions/base.exception";

export class InvalidRefreshTokenException extends BaseException {
  statusCode = 401;

  constructor() {
    super("Invalid or expired refresh token");
  }
}
