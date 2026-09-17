import { BaseException } from "@/core/exceptions/base.exception";

export class NotGroupMemberException extends BaseException {
  statusCode = 404;

  constructor(groupId: number) {
    super(`User group with id ${groupId} not found`);
  }
}
