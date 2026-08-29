import { BaseException } from "@/core/exceptions/base.exception";

export class InvalidAccessTokenException extends BaseException {
  statusCode = 401;

  constructor() {
    super("Invalid or expired access token");
  }
}
