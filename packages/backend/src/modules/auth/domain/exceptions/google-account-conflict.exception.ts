import { BaseException } from "@/core/exceptions/base.exception";

export class GoogleAccountConflictException extends BaseException {
  statusCode = 409;

  constructor() {
    super("This account is already linked to a different Google account");
  }
}
