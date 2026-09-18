import { BaseException } from "@/core/exceptions/base.exception";

export class UserNotFoundByEmailException extends BaseException {
  statusCode = 404;

  constructor(email: string) {
    super(`User with email "${email}" not found`);
  }
}
