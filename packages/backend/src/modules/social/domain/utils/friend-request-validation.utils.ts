import { StringUtils } from "@/shared/utils/string.utils";
import { FriendRequestValidationException } from "../exceptions/friend-request-validation.exception";

export class FriendRequestValidationUtils {
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  static assertValidUserId(userId: number): void {
    const isPositiveInteger = Number.isInteger(userId) && userId > 0;

    if (!isPositiveInteger) {
      throw new FriendRequestValidationException(
        `userId must be a positive integer, received ${userId}`,
      );
    }
  }

  static assertValidFriendRequestId(friendRequestId: number): void {
    const isPositiveInteger =
      Number.isInteger(friendRequestId) && friendRequestId > 0;

    if (!isPositiveInteger) {
      throw new FriendRequestValidationException(
        `friendRequestId must be a positive integer, received ${friendRequestId}`,
      );
    }
  }

  static assertValidEmail(email: string): void {
    if (StringUtils.isEmptyString(email)) {
      throw new FriendRequestValidationException("email is required");
    }

    const normalizedEmail = email.trim();
    const isValidEmail = FriendRequestValidationUtils.EMAIL_PATTERN.test(normalizedEmail);

    if (!isValidEmail) {
      throw new FriendRequestValidationException(`invalid email: ${email}`);
    }
  }

  static assertNotSelf(requesterId: number, targetUserId: number): void {
    FriendRequestValidationUtils.assertValidUserId(requesterId);
    FriendRequestValidationUtils.assertValidUserId(targetUserId);

    if (requesterId === targetUserId) {
      throw new FriendRequestValidationException(
        "cannot send friend request to yourself",
      );
    }
  }

  static normalizeEmail(email: string): string {
    FriendRequestValidationUtils.assertValidEmail(email);

    return email.trim().toLowerCase();
  }
}
