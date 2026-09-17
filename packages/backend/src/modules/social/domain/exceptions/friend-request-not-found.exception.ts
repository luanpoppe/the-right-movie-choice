import { BaseException } from "@/core/exceptions/base.exception";

export class FriendRequestNotFoundException extends BaseException {
  statusCode = 404;

  constructor(friendRequestId: number) {
    super(`Friend request with id ${friendRequestId} not found`);
  }
}
