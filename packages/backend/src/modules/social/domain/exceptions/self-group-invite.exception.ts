import { BaseException } from "@/core/exceptions/base.exception";

export class SelfGroupInviteException extends BaseException {
  statusCode = 400;

  constructor() {
    super("Cannot invite yourself to a group");
  }
}
