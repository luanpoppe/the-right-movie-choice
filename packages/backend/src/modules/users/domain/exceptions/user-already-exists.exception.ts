import { BaseException } from "@/core/exceptions/base.exception";

export class UserAlreadyExistsException extends BaseException {
  statusCode = 409;

  constructor(email: string) {
    super(`User with email "${email}" already exists`);
  }
}
