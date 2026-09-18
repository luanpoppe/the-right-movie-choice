import { StringUtils } from "@/shared/utils/string.utils";
import { UserGroupValidationException } from "../exceptions/user-group-validation.exception";

export const MAX_GROUP_NAME_LENGTH = 100;
export const MAX_GROUP_DESCRIPTION_LENGTH = 500;
export const MAX_GROUP_MEMBERS = 100;

export class UserGroupValidationUtils {
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  static assertValidUserId(userId: number): void {
    const isPositiveInteger = Number.isInteger(userId) && userId > 0;

    if (!isPositiveInteger) {
      throw new UserGroupValidationException(
        `userId must be a positive integer, received ${userId}`,
      );
    }
  }

  static assertValidGroupId(groupId: number): void {
    const isPositiveInteger = Number.isInteger(groupId) && groupId > 0;

    if (!isPositiveInteger) {
      throw new UserGroupValidationException(
        `groupId must be a positive integer, received ${groupId}`,
      );
    }
  }

  static assertValidGroupInviteId(groupInviteId: number): void {
    const isPositiveInteger =
      Number.isInteger(groupInviteId) && groupInviteId > 0;

    if (!isPositiveInteger) {
      throw new UserGroupValidationException(
        `groupInviteId must be a positive integer, received ${groupInviteId}`,
      );
    }
  }

  static assertValidEmail(email: string): void {
    if (StringUtils.isEmptyString(email)) {
      throw new UserGroupValidationException("email is required");
    }

    const normalizedEmail = email.trim();
    const isValidEmail = UserGroupValidationUtils.EMAIL_PATTERN.test(normalizedEmail);

    if (!isValidEmail) {
      throw new UserGroupValidationException(`invalid email: ${email}`);
    }
  }

  static assertValidName(name: string): void {
    if (StringUtils.isEmptyString(name)) {
      throw new UserGroupValidationException("name is required");
    }

    const trimmedName = name.trim();
    const isEmptyAfterTrim = trimmedName.length === 0;

    if (isEmptyAfterTrim) {
      throw new UserGroupValidationException("name is required");
    }

    const exceedsMaxLength = trimmedName.length > MAX_GROUP_NAME_LENGTH;

    if (exceedsMaxLength) {
      throw new UserGroupValidationException(
        `name must be at most ${MAX_GROUP_NAME_LENGTH} characters`,
      );
    }
  }

  static assertValidDescription(description?: string | null): void {
    if (description == null) {
      return;
    }

    const exceedsMaxLength = description.length > MAX_GROUP_DESCRIPTION_LENGTH;

    if (exceedsMaxLength) {
      throw new UserGroupValidationException(
        `description must be at most ${MAX_GROUP_DESCRIPTION_LENGTH} characters`,
      );
    }
  }

  static assertNotSelf(inviterId: number, targetUserId: number): void {
    UserGroupValidationUtils.assertValidUserId(inviterId);
    UserGroupValidationUtils.assertValidUserId(targetUserId);

    if (inviterId === targetUserId) {
      throw new UserGroupValidationException("cannot invite yourself");
    }
  }

  static normalizeEmail(email: string): string {
    UserGroupValidationUtils.assertValidEmail(email);

    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();

    return normalizedEmail;
  }
}
