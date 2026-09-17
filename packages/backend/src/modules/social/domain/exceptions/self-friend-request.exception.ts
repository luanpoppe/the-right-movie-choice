import { BaseException } from "@/core/exceptions/base.exception";

export class SelfFriendRequestException extends BaseException {
  statusCode = 400;

  constructor() {
    super("Cannot send friend request to yourself");
  }
}
