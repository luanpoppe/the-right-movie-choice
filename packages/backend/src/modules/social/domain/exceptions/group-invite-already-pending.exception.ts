import { BaseException } from "@/core/exceptions/base.exception";

export class GroupInviteAlreadyPendingException extends BaseException {
  statusCode = 409;

  constructor() {
    super("Group invite already pending for this user in this group");
  }
}
