import { BaseException } from "@/core/exceptions/base.exception";

export class UserGroupNotFoundException extends BaseException {
  statusCode = 404;

  constructor(groupId: number) {
    super(`User group with id ${groupId} not found`);
  }
}
