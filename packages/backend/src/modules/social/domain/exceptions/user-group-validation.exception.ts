import { BaseException } from "@/core/exceptions/base.exception";

export class UserGroupValidationException extends BaseException {
  statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
