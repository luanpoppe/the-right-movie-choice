import { BaseException } from "@/core/exceptions/base.exception";

export class GroupFullException extends BaseException {
  statusCode = 409;

  constructor() {
    super("Group has reached the maximum number of members");
  }
}
