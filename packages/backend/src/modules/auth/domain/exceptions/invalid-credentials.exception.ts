import { BaseException } from "@/core/exceptions/base.exception";

export class InvalidCredentialsException extends BaseException {
  statusCode = 401;

  constructor() {
    super("Invalid email or password");
  }
}
