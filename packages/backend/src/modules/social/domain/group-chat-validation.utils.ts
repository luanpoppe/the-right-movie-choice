import { StringUtils } from "@/shared/utils/string.utils";
import type { CreateGroupChatInput } from "./entities/group-chat.entity";
import { GroupChatValidationException } from "./exceptions/group-chat-validation.exception";

export const MAX_TITLE_LENGTH = 200;

export class GroupChatValidationUtils {
  private static readonly CHAT_ID_UUID_V4_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  static assertValidGroupId(groupId: number): void {
    const isPositiveInteger = Number.isInteger(groupId) && groupId > 0;

    if (!isPositiveInteger) {
      throw new GroupChatValidationException(
        `groupId must be a positive integer, received ${groupId}`,
      );
    }
  }

  static assertValidId(id: number): void {
    const isPositiveInteger = Number.isInteger(id) && id > 0;

    if (!isPositiveInteger) {
      throw new GroupChatValidationException(
        `id must be a positive integer, received ${id}`,
      );
    }
  }

  static assertValidChatId(chatId: string): void {
    const isEmptyChatId = StringUtils.isEmptyString(chatId);
    if (isEmptyChatId) {
      throw new GroupChatValidationException(
        "chatId must be a non-empty UUID v4 string",
      );
    }

    const matchesUuidV4 =
      GroupChatValidationUtils.CHAT_ID_UUID_V4_PATTERN.test(chatId);
    if (!matchesUuidV4) {
      throw new GroupChatValidationException(
        `chatId must be a valid UUID v4 string, received ${chatId}`,
      );
    }
  }

  static assertValidTitle(title: string): void {
    const titleLength = title.length;
    const isWithinLimit = titleLength <= MAX_TITLE_LENGTH;

    if (!isWithinLimit) {
      throw new GroupChatValidationException(
        `title must be at most ${MAX_TITLE_LENGTH} characters, received ${titleLength}`,
      );
    }
  }

  static assertValidFilterMemberUserIds(filterMemberUserIds: number[]): void {
    const isArray = Array.isArray(filterMemberUserIds);
    if (!isArray) {
      throw new GroupChatValidationException(
        "filterMemberUserIds must be an array of positive integers",
      );
    }

    const seenUserIds = new Set<number>();

    for (const userId of filterMemberUserIds) {
      const isPositiveInteger = Number.isInteger(userId) && userId > 0;

      if (!isPositiveInteger) {
        throw new GroupChatValidationException(
          `filterMemberUserIds must contain only positive integers, received ${userId}`,
        );
      }

      const isDuplicate = seenUserIds.has(userId);
      if (isDuplicate) {
        throw new GroupChatValidationException(
          `filterMemberUserIds must not contain duplicate user ids, received duplicate ${userId}`,
        );
      }

      seenUserIds.add(userId);
    }
  }

  static assertValidCreateInput(input: CreateGroupChatInput): void {
    GroupChatValidationUtils.assertValidGroupId(input.groupId);
    GroupChatValidationUtils.assertValidChatId(input.chatId);
    GroupChatValidationUtils.assertValidFilterMemberUserIds(
      input.filterMemberUserIds,
    );

    const title = input.title;
    const hasTitle = title != null;

    if (!hasTitle) {
      return;
    }

    GroupChatValidationUtils.assertValidTitle(title);
  }
}
