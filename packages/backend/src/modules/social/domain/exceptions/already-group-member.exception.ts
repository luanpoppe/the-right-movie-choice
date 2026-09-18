import { BaseException } from "@/core/exceptions/base.exception";

export class AlreadyGroupMemberException extends BaseException {
  statusCode = 409;

  constructor() {
    super("User is already a member of this group");
  }
}
