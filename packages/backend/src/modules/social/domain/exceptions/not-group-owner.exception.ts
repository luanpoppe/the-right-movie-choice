import { BaseException } from "@/core/exceptions/base.exception";

export class NotGroupOwnerException extends BaseException {
  statusCode = 404;

  constructor(groupId: number) {
    super(`User group with id ${groupId} not found`);
  }
}
