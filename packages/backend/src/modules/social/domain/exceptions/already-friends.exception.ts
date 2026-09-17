import { BaseException } from "@/core/exceptions/base.exception";

export class AlreadyFriendsException extends BaseException {
  statusCode = 409;

  constructor() {
    super("Users are already friends");
  }
}
