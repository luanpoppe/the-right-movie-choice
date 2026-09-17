import { StringUtils } from "@/shared/utils/string.utils";
import { UserConversationConstants } from "./user-conversation.constants";
import { UserConversationValidationException } from "./exceptions/user-conversation-validation.exception";

export class UserConversationValidationUtils {
  private static readonly CHAT_ID_UUID_V4_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  static assertValidUserId(userId: number): void {
    const isPositiveInteger = Number.isInteger(userId) && userId > 0;

    if (!isPositiveInteger) {
      throw new UserConversationValidationException(
        `userId must be a positive integer, received ${userId}`,
      );
    }
  }

  static assertValidChatId(chatId: string): void {
    const isEmptyChatId = StringUtils.isEmptyString(chatId);
    if (isEmptyChatId) {
      throw new UserConversationValidationException(
        "chatId must be a non-empty UUID v4 string",
      );
    }

    const matchesUuidV4 =
      UserConversationValidationUtils.CHAT_ID_UUID_V4_PATTERN.test(chatId);
    if (!matchesUuidV4) {
      throw new UserConversationValidationException(
        `chatId must be a valid UUID v4 string, received ${chatId}`,
      );
    }
  }

  static assertValidTitle(title: string): void {
    const titleLength = title.length;
    const maxTitleLength = UserConversationConstants.MAX_TITLE_LENGTH;
    const isWithinLimit = titleLength <= maxTitleLength;

    if (!isWithinLimit) {
      throw new UserConversationValidationException(
        `title must be at most ${maxTitleLength} characters, received ${titleLength}`,
      );
    }
  }

  static assertValidCreateInput(userId: number, chatId: string): void {
    UserConversationValidationUtils.assertValidUserId(userId);
    UserConversationValidationUtils.assertValidChatId(chatId);
  }
}
