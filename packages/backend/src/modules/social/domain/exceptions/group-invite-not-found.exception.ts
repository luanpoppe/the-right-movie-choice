import { BaseException } from "@/core/exceptions/base.exception";

export class GroupInviteNotFoundException extends BaseException {
  statusCode = 404;

  constructor(groupInviteId: number) {
    super(`Group invite with id ${groupInviteId} not found`);
  }
}
