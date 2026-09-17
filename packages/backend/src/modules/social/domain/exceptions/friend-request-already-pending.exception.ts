import { BaseException } from "@/core/exceptions/base.exception";

export class FriendRequestAlreadyPendingException extends BaseException {
  statusCode = 409;

  constructor() {
    super("Friend request already pending between these users");
  }
}
